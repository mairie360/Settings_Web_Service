const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, describe, test } = require('node:test');
const path = require('node:path');
const { ROOT, requireSrc } = require('./support/load-ts.cjs');
const { OpenApiContract } = require('./support/openapi-contract.cjs');
const { ContractMockServer, unreachableUrl } = require('./support/contract-mock-server.cjs');
const { createFront } = require('./support/front-harness.cjs');
const fixtures = require('./support/settings-fixtures.cjs');

// Chemin réseau complet du front : code navigateur (src/lib/settings-api.ts) → proxy contractuel de src/app → vrai
// client HTTP → faux BFF_Settings servi en HTTP réel. Son contrat est contracts/openapi.json, reconstruction exacte
// du paquet publié @mairie360/bff-settings-openapi à la version épinglée (package-contract.test.cjs) : le mock refuse
// toute route, méthode ou corps hors contrat et valide ses réponses. orval ne type que les succès (et les 404 des
// préférences) : les autres réponses d'erreur simulées sont marquées `outOfContract`. Un front n'appelle qu'un BFF : le harnais refuse tout appel
// navigateur hors origine et tout appel serveur vers un autre hôte que BFF_Settings.

const bffContract = OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json'));
const bffSettings = new ContractMockServer('BFF_SETTINGS', bffContract, { metadataPaths: ['/openapi.json', '/swagger.json'] });
let unreachable = '';
const front = createFront({
  cookies: { accessToken: fixtures.ACCESS_TOKEN },
  upstreams: () => [bffSettings.url, unreachable],
});

const { loadSettings, saveProfile } = requireSrc('lib/settings-api.ts');

const BFF_URL_VARIABLES = ['SETTINGS_BFF_URL', 'BFF_SETTINGS_BASE_URL'];
const savedEnv = Object.fromEntries(BFF_URL_VARIABLES.map((name) => [name, process.env[name]]));

before(async () => {
  await bffSettings.start();
  unreachable = await unreachableUrl();
  front.install();
});
after(async () => {
  front.uninstall();
  await bffSettings.stop();
  for (const [name, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});
beforeEach(() => {
  bffSettings.reset();
  front.reset();
  for (const name of BFF_URL_VARIABLES) delete process.env[name];
  process.env.SETTINGS_BFF_URL = bffSettings.url;
});
afterEach(() => {
  assert.deepEqual([...front.violations, ...bffSettings.violations], []);
});

const upstreamOrigins = () => [...new Set(front.upstreamCalls.map(({ url }) => url.origin))];

/** Appel émis par le navigateur vers l'origine du front, comme le ferait `fetch` dans la page. */
const browser = (pathname, init) => globalThis.fetch(pathname, init);

/** Erreur BFF_Settings `{ error: { message } }` : non typée par orval, donc hors contrat publié. */
const bffError = (status, message) => ({ status, body: fixtures.error(message), outOfContract: true });

describe('page calls (src/lib/settings-api.ts) against the published BFF_Settings contract mock', () => {
  test('loadSettings reads GET /settings/bootstrap with the accessToken cookie as Bearer', async () => {
    const body = fixtures.bootstrap({ sessions: [fixtures.session('s-1'), fixtures.session('s-2', { revoked_at: '2026-09-16T08:00:00Z' })] });
    bffSettings.on('GET', '/settings/bootstrap', { body });

    assert.deepEqual(await loadSettings(), body);

    assert.deepEqual(front.browserCalls, [{ method: 'GET', path: '/settings/bootstrap' }]);
    assert.deepEqual(upstreamOrigins(), [new URL(bffSettings.url).origin]);
    const [received] = bffSettings.requests;
    assert.equal(bffSettings.requests.length, 1);
    assert.equal(received.template, '/settings/bootstrap');
    assert.equal(received.headers.authorization, `Bearer ${fixtures.ACCESS_TOKEN}`);
    assert.equal(received.headers.accept, 'application/json');
    assert.equal(received.headers.cookie, undefined);
    assert.deepEqual(received.undeclaredQuery, []);
    assert.equal(received.body, undefined);
  });

  test('loadSettings keeps sessions marked unavailable by the BFF', async () => {
    const body = fixtures.bootstrap({ sessions: [], sources: { sessions: 'unavailable' } });
    bffSettings.on('GET', '/settings/bootstrap', { body });

    assert.deepEqual(await loadSettings(), body);
  });

  test('saveProfile sends a SettingsProfilePatch with PATCH /settings/profile and returns the saved profile', async () => {
    const edited = fixtures.profile({ last_name: 'Le Gall-Martin', phone: null });
    const saved = fixtures.profile({ last_name: 'LE GALL-MARTIN', phone: null });
    bffSettings.on('PATCH', '/settings/profile', { body: saved });

    assert.deepEqual(await saveProfile(edited), saved);

    assert.deepEqual(front.browserCalls, [{ method: 'PATCH', path: '/settings/profile' }]);
    const [received] = bffSettings.calls('/settings/profile', 'PATCH');
    assert.deepEqual(received.body, edited);
    assert.equal(received.headers['content-type'], 'application/json');
    assert.equal(received.headers.authorization, `Bearer ${fixtures.ACCESS_TOKEN}`);
  });

  // Statuts d'erreur renvoyés par BFF_Settings (session invalide, corps refusé, Core indisponible ou non configuré).
  for (const [name, call, method, template, statuses] of [
    ['loadSettings', () => loadSettings(), 'GET', '/settings/bootstrap', [401, 502, 503]],
    ['saveProfile', () => saveProfile({ first_name: 'Anne' }), 'PATCH', '/settings/profile', [400, 401, 502, 503]],
  ]) {
    for (const status of statuses) {
      test(`${name} rejects with the BFF message on a ${status}`, async () => {
        bffSettings.on(method, template, bffError(status, `Refus ${status} du BFF.`));

        await assert.rejects(call(), { message: `Refus ${status} du BFF.` });
        assert.equal(bffSettings.calls(template, method).length, 1);
      });
    }
  }

  test('an error without a JSON message falls back to the status', async () => {
    bffSettings.on('PATCH', '/settings/profile', { status: 502, raw: 'Bad Gateway', contentType: 'text/plain', outOfContract: true });

    await assert.rejects(saveProfile({ first_name: 'Anne' }), { message: 'Le service a répondu 502.' });
  });

  test('a BFF that drops the connection becomes a controlled 502', async () => {
    bffSettings.on('GET', '/settings/bootstrap', { dropConnection: true });

    await assert.rejects(loadSettings(), { message: 'Le service est indisponible.' });
  });

  test('an unreachable BFF becomes a controlled 502 without any other network call', async () => {
    process.env.SETTINGS_BFF_URL = unreachable;

    await assert.rejects(loadSettings(), { message: 'Le service est indisponible.' });
    assert.deepEqual(upstreamOrigins(), [new URL(unreachable).origin]);
    assert.equal(bffSettings.requests.length, 0);
  });

  test('BFF_SETTINGS_BASE_URL is used when SETTINGS_BFF_URL is not set', async () => {
    delete process.env.SETTINGS_BFF_URL;
    process.env.BFF_SETTINGS_BASE_URL = `${bffSettings.url}/`;
    bffSettings.on('GET', '/settings/bootstrap', { body: fixtures.bootstrap() });

    await loadSettings();
    assert.equal(bffSettings.requests.length, 1);
  });
});

describe('same-origin proxy exposes exactly the published BFF_Settings contract', () => {
  for (const { method, template } of bffContract.operations()) {
    test(`${method} ${template} reaches the BFF unchanged`, async () => {
      const operation = fixtures.SETTINGS_OPERATIONS[`${method} ${template}`];
      assert.ok(operation, `ajouter ${method} ${template} à SETTINGS_OPERATIONS (tests/support/settings-fixtures.cjs)`);
      bffSettings.on(method, template, operation.reply);

      const response = await browser(template, operation.send
        ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(operation.send) }
        : { method });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), operation.reply.body);
      assert.deepEqual(bffSettings.requests.map((received) => `${received.method} ${received.template}`), [`${method} ${template}`]);
      assert.deepEqual(bffSettings.requests[0].body, operation.send);
    });
  }

  test('HEAD is relayed for GET operations', async () => {
    bffSettings.on('GET', '/health', { body: { status: 'ok' } });

    const response = await browser('/health', { method: 'HEAD' });

    assert.equal(response.status, 200);
    assert.equal(await response.text(), '');
    assert.deepEqual(bffSettings.requests.map((received) => received.method), ['HEAD']);
  });

  test('the BFF OpenAPI documents stay reachable', async () => {
    for (const document of ['/openapi.json', '/swagger.json']) {
      const response = await browser(document);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).info.title, bffContract.title);
    }
    assert.deepEqual(bffSettings.requests.map((received) => received.template), ['/openapi.json', '/swagger.json']);
  });

  test('the 404 of a preference not yet supported by Core is relayed', async () => {
    bffSettings.on('PATCH', '/settings/notifications', { status: 404, body: fixtures.error('Route absente du contrat') });

    const response = await browser('/settings/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{"emailDigest":true}' });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), fixtures.error('Route absente du contrat'));
  });

  for (const [label, pathname, method, status] of [
    ['a path absent from the contract', '/settings/security', 'GET', 404],
    ['a Core API path', '/api/v1/user/me/', 'GET', 404],
    ['a deeper path than the contract', '/settings/bootstrap/extra', 'GET', 404],
    ['a method not declared for the path', '/settings/profile', 'GET', 405],
    ['a write on a read-only path', '/settings/bootstrap', 'DELETE', 405],
    ['a POST instead of PATCH', '/settings/profile', 'POST', 405],
    ['an encoded slash', '/settings%2Fbootstrap', 'GET', 400],
  ]) {
    test(`${label} (${method} ${pathname}) answers ${status} without any BFF call`, async () => {
      const response = await browser(pathname, { method });

      assert.equal(response.status, status);
      if (status === 405) assert.match(response.headers.get('allow'), /^[A-Z, ]+$/);
      assert.deepEqual(front.upstreamCalls, []);
    });
  }
});

describe('the front talks to a single BFF', () => {
  test('a whole page session (bootstrap, then profile save) only contacts BFF_Settings', async () => {
    bffSettings
      .on('GET', '/settings/bootstrap', { body: fixtures.bootstrap() })
      .on('PATCH', '/settings/profile', { body: fixtures.profile({ first_name: 'Anne' }) });

    const { profile } = await loadSettings();
    await saveProfile({ ...profile, first_name: 'Anne' });

    assert.deepEqual(upstreamOrigins(), [new URL(bffSettings.url).origin]);
    assert.deepEqual(front.upstreamCalls.map(({ route }) => route), ['app/[...path]/route.ts', 'app/[...path]/route.ts']);
  });

  for (const [method, pathname] of [
    ['GET', '/api/user/me'],
    ['GET', '/api/auth/me'],
    ['GET', '/api/auth/session'],
    ['POST', '/api/auth/logout'],
  ]) {
    test(`the BFF User session path ${method} ${pathname} is not served by this front`, async () => {
      const response = await browser(pathname, { method });

      assert.equal(response.status, 404);
      assert.deepEqual(front.upstreamCalls, []);
    });
  }
});

describe('network guard of the test harness', () => {
  test('a browser call to another origin is reported', async () => {
    await assert.rejects(browser(`${bffSettings.url}/settings/bootstrap`), TypeError);

    assert.deepEqual(front.violations, [`navigateur : GET ${bffSettings.url}/settings/bootstrap sort de l'origine du front`]);
    assert.equal(bffSettings.requests.length, 0);
    front.violations.length = 0;
  });

  test('a server call to a host that is not BFF_Settings is reported', async () => {
    process.env.SETTINGS_BFF_URL = 'http://203.0.113.10:4008';

    await assert.rejects(loadSettings(), { message: 'Le service est indisponible.' });

    assert.equal(front.violations.length, 1);
    assert.match(front.violations[0], /ne vise pas BFF_Settings/);
    front.violations.length = 0;
  });
});
