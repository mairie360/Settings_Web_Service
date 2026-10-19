const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, test } = require('node:test');
const { ROOT, requireSrc } = require('./support/load-ts.cjs');
const { OpenApiContract } = require('./support/openapi-contract.cjs');
const { scanNetworkSurface } = require('./support/network-surface.cjs');
const fixtures = require('./support/settings-fixtures.cjs');
const policy = require('./support/source-policy.cjs');

// Le contrat de référence du front est celui publié par BFF_Settings dans le paquet @mairie360/bff-settings-openapi,
// à la version exacte épinglée dans package.json, reconstruit dans contracts/openapi.json.
// The browser uses its own Settings origin. Business operations use the exact
// Settings SDK contract; the server delegates renewal/logout and the actual
// User /me role read to the existing Login owner, without another SDK client.

const PACKAGE = '@mairie360/bff-settings-openapi';
// Reconstruction exacte du paquet publié à la version épinglée (vérifiée par package-contract.test.cjs).
const contract = OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json'));
const surface = scanNetworkSurface();

const operationKeys = () => contract.operations().map(({ method, template }) => `${method} ${template}`).sort();
const successSchema = (method, template) => contract.responseSchema(contract.match(method, template), 200).schema;

describe('published BFF_Settings contract in src/', () => {
  test('the proxy allowlist is the snapshot rebuilt from the package', () => {
    assert.ok(policy.imports(policy.parse('src/lib/bff-proxy.ts')).includes('../../contracts/openapi.json'));
    assert.equal(contract.document.info['x-source-package'].split('@').slice(0, 2).join('@'), PACKAGE);
  });

  test('the package is the only OpenAPI package imported: types from /model, the generated client only in src/lib/bff-client.ts', () => {
    assert.ok(surface.openapiPackages.length > 0);
    for (const entry of surface.openapiPackages) {
      const client = entry.file === 'lib/bff-client.ts' && entry.specifier === `${PACKAGE}/endpoints/bffSettings`;
      assert.ok(client || (entry.typeOnly && entry.specifier === `${PACKAGE}/model`), `${entry.at} : import only types from '${PACKAGE}/model' (the generated client belongs to src/lib/bff-client.ts)`);
    }
  });
});

describe('network surface of src/', () => {
  test('only declared data, role and logout adapters use a raw network API', () => {
    assert.deepEqual(surface.raw.map(({ file, api }) => `${file} ${api}`), [
      'lib/bff-client.ts sessionFetch',
      'lib/logout.ts fetch',
      'lib/session-role-proxy.ts fetch',
      'lib/session-role.ts fetch',
    ]);
  });

  test('the frontend has no hard-coded absolute network URL', () => {
    assert.deepEqual(surface.absoluteUrls.map(({ file, url }) => `${file} ${url}`), []);
  });

  test('browser facades and the access-only server read use generated operations', () => {
    assert.ok(surface.bffOperations.length > 0);
    assert.deepEqual([...new Set(surface.bffOperations.map(({ file }) => file))], ['lib/server-settings.ts', 'lib/settings-api.ts']);
    assert.deepEqual(surface.bffOperations.filter(entry => entry.file === 'lib/server-settings.ts').map(entry => entry.operation), ['getSettingsBootstrap']);
    // The factory binds either the browser transport or the tested access-only server relay.
    // No consumer calls the raw browser transport or writes a business path.
    assert.deepEqual(surface.requestBff.map(({ file }) => file), []);
    assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'src/lib/settings-api.ts'), 'utf8'), /requestBff|["'`]\/(?:settings|api|bff)\b/);
  });

  test('every called operation exists in the generated client and in the published contract', () => {
    const generated = fs.readFileSync(path.join(ROOT, 'node_modules', PACKAGE, 'endpoints', 'bffSettings.ts'), 'utf8');
    const called = surface.bffOperations.map(({ operation }) => operation);
    for (const name of called) assert.match(generated, new RegExp(`const ${name} = \\(`), `${name} is not a generated operation`);
    const routes = called.map((name) => {
      const [, method, template] = generated.match(new RegExp('const ' + name + ' = \\([^]*?axiosInstance\\.(\\w+)\\(\\s*\\x60([^\\x60]+)\\x60'));
      assert.ok(contract.match(method.toUpperCase(), template), `${name}: ${method} ${template} absent de ${PACKAGE}`);
      return `${method.toUpperCase()} ${template}`;
    });
    assert.deepEqual([...new Set(routes)], ['GET /settings/bootstrap', 'PATCH /settings/profile', 'PATCH /settings/appearance', 'PATCH /settings/general', 'PATCH /settings/notifications']);
  });

  test('business requests use the Settings contract proxy and configured BFF URL', () => {
    assert.deepEqual(surface.forwardToBff.map(({ file }) => file), ['lib/bff-proxy.ts', 'lib/server-settings.ts']);
    for (const file of ['src/lib/bff-proxy.ts', 'src/lib/server-settings.ts']) assert.ok(policy.calls(policy.parse(file), 'forwardToBff').every(node => policy.configuredUrl(node.arguments[1])));
  });

  test('only the business relay and explicit Login owner adapters are server routes', () => {
    assert.deepEqual(surface.routes, ['app/[...path]/route.ts', 'app/api/auth/logout/route.ts', 'app/api/auth/refresh/route.ts', 'app/api/auth/resume/route.ts', 'app/api/auth/role/route.ts']);
  });

  test('environment reads are limited to the BFF and explicit active-front navigation URLs', () => {
    const expected = {
      'app/api/auth/logout/route.ts': ['LOGIN_FRONT_URL', 'SETTINGS_FRONT_URL'],
      'app/layout.tsx': ['COOKIE_DOMAIN', 'INSTANCE_TIMEZONE'],
      'lib/bff-proxy.ts': ['LOGIN_FRONT_URL', 'SETTINGS_FRONT_URL', 'SETTINGS_BFF_URL', 'BFF_SETTINGS_BASE_URL'],
      // MAIR-357: public realm URL, only to link the account console (no call to Keycloak).
      'lib/keycloak-account.ts': ['KEYCLOAK_REALM_URL'],
      'lib/session-role-proxy.ts': ['SETTINGS_FRONT_URL', 'LOGIN_FRONT_URL', 'NODE_ENV'],
      'lib/session-peer.ts': ['LOGIN_FRONT_URL', 'SETTINGS_FRONT_URL'],
      'lib/server-settings.ts': ['SETTINGS_FRONT_URL'],
      'middleware.ts': ['LOGIN_FRONT_URL', 'SETTINGS_FRONT_URL'],
    };
    assert.deepEqual(surface.env.map(({ file, name }) => `${file} ${name}`).sort(),
      Object.entries(expected).flatMap(([file, names]) => names.map(name => `${file} ${name}`)).sort());
  });

  test('the browser Content-Security-Policy only allows same-origin connections', () => {
    const { buildContentSecurityPolicy } = require('@mairie360/front-kit/shared');
    for (const isDevelopment of [false, true]) {
      const directives = buildContentSecurityPolicy('nonce', isDevelopment).split('; ');
      assert.ok(directives.includes("connect-src 'self'"));
      assert.ok(directives.includes("default-src 'self'"));
    }
  });
});

describe('fixtures conform to the published contract', () => {
  test('every published operation has a conforming fixture', () => {
    assert.deepEqual(Object.keys(fixtures.SETTINGS_OPERATIONS).sort(), operationKeys());
    for (const [key, { send, reply }] of Object.entries(fixtures.SETTINGS_OPERATIONS)) {
      const [method, template] = key.split(' ');
      assert.deepEqual(contract.validate(successSchema(method, template), reply.body), [], key);
      const { schema } = contract.requestBodySchema(contract.match(method, template));
      if (send !== undefined) assert.deepEqual(contract.validate(schema, send), [], `${key} (corps envoyé)`);
    }
  });

  test('bootstrap, profile and error fixtures', () => {
    assert.deepEqual(contract.validate(contract.schema('SettingsBootstrap'), fixtures.bootstrap({ sessions: [fixtures.session('s-2', { revoked_at: '2026-09-16T08:00:00Z' })], sources: { sessions: 'unavailable' } })), []);
    assert.deepEqual(contract.validate(contract.schema('SettingsProfilePatch'), fixtures.profile({ phone: null })), []);
    // ErrorResponse n'est rattaché à aucune opération par orval, mais le modèle est publié : c'est le corps des erreurs du BFF.
    assert.deepEqual(contract.validate(contract.schema('ErrorResponse'), fixtures.error('Refus')), []);
    assert.deepEqual(contract.validate(contract.schema('ErrorResponse'), fixtures.error('Refus', 404)), []);
  });

  test('the validator reports contract violations', () => {
    assert.deepEqual(contract.validate(contract.schema('SettingsBootstrap'), { profile: { first_name: 42, email: 'anne@mairie.test' }, sessions: {}, appearance: null, general: null, notifications: null, sources: { sessions: 'maybe', preferences: 'available', notifications: 'available' } }), [
      '$.profile.last_name: propriété requise manquante',
      '$.profile.first_name: type string attendu, reçu number',
      '$.sessions: type array attendu, reçu object',
      '$.sources.sessions: valeur "maybe" hors enum ["available","unavailable"]',
    ]);
    assert.deepEqual(contract.validateRequest('GET', new URL('http://bff/settings/profile')).errors, ["GET /settings/profile n'existe pas dans le contrat bff_settings"]);
  });
});
