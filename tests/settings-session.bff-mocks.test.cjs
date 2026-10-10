const assert = require('node:assert/strict');
const { test, before, after, beforeEach, afterEach } = require('node:test');
const { NextRequest } = require('next/server');
const { ROOT, requireSrc } = require('./support/load-ts.cjs');
const { OpenApiContract } = require('./support/openapi-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { createFront, ORIGIN } = require('./support/front-harness.cjs');
const fixtures = require('./support/settings-fixtures.cjs');
const { middleware, config } = requireSrc('middleware.ts');
const { loadSettings, saveProfile } = requireSrc('lib/settings-api.ts');
const { setBrowserFrontUrls } = requireSrc('lib/front-urls.ts');
const mock = new ContractMockServer('settings-session', OpenApiContract.load(`${ROOT}/contracts/openapi.json`), {
  metadataPaths: ['/openapi.json', '/swagger.json'],
});
const front = createFront({ cookies: {}, upstreams: () => [mock.url] });
const envKeys = ['SETTINGS_BFF_URL', 'LOGIN_FRONT_URL', 'COOKIE_DOMAIN'];
const savedEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
const savedWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const jwt = exp => `e30.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.fixture`;
let routedFetch;
let destinations;

before(async () => {
  await mock.start();
  front.install();
  routedFetch = globalThis.fetch;
  // Exercise the actual middleware before the unchanged contract catch-all.
  // Upstream fetches keep the existing harness's AsyncLocalStorage isolation.
  globalThis.fetch = (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : String(input), ORIGIN);
    if (url.origin !== ORIGIN || url.pathname.startsWith('/api/')) return routedFetch(input, init);
    const headers = new Headers(init.headers);
    headers.set('cookie', Object.entries(front.cookies).map(([key, value]) => `${key}=${value}`).join('; '));
    const gate = middleware(new NextRequest(url, { ...init, headers }));
    return gate.status === 200 ? routedFetch(input, init) : Promise.resolve(gate);
  };
});
after(async () => {
  front.uninstall();
  await mock.stop();
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  if (savedWindow) Object.defineProperty(globalThis, 'window', savedWindow);
  else delete globalThis.window;
});
beforeEach(() => {
  mock.reset(); front.reset();
  for (const key of Object.keys(front.cookies)) delete front.cookies[key];
  process.env.SETTINGS_BFF_URL = mock.url;
  process.env.LOGIN_FRONT_URL = 'https://login.test.example/';
  delete process.env.COOKIE_DOMAIN;
  destinations = [];
  globalThis.window = { location: { origin: ORIGIN, pathname: '/', search: '', assign: href => destinations.push(href) } };
  setBrowserFrontUrls({ LOGIN_FRONT_URL: process.env.LOGIN_FRONT_URL, SETTINGS_FRONT_URL: ORIGIN });
});
afterEach(() => assert.deepEqual([...front.violations, ...mock.violations], []));
const page = (cookies = {}, pathname = '/', method = 'GET') => new NextRequest(`${ORIGIN}${pathname}`, {
  method, headers: { cookie: Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join('; ') },
});

for (const [label, cookie] of [
  ['missing', undefined], ['empty', ''], ['expired', jwt(1)], ['malformed JWT payload', 'e30.not-json.fixture'],
  ['opaque', 'opaque-session'], ['two segments', 'a.b'], ['missing expiry', jwt(undefined)], ['non-numeric expiry', jwt('4102444800')], ['null expiry', jwt(null)],
]) {
  test(`${label} cookie redirects a page to configured Login without rendering Settings`, () => {
    const response = middleware(page(cookie === undefined ? {} : { accessToken: cookie }));
    assert.equal(response.status, 307);
    const destination = new URL(response.headers.get('location'));
    assert.equal(destination.origin, 'https://login.test.example');
    assert.equal(destination.searchParams.get('redirect'), ORIGIN + '/');
    assert.equal(destination.searchParams.get('resumeSession'), '1');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(mock.requests.length, 0);
  });
}

test('authenticated pages retain the current nonce CSP; expiry hints are not signature validation', () => {
  for (const token of [jwt(4102444800), fixtures.ACCESS_TOKEN]) {
    const response = middleware(page({ accessToken: token }));
    assert.equal(response.status, 200);
    const nonce = response.headers.get('x-middleware-request-x-nonce');
    assert.ok(nonce);
    assert.match(response.headers.get('content-security-policy'), new RegExp(`nonce-${nonce}`));
  }
});

test('missing, unsafe or credential-bearing Login configuration fails closed instead of localhost fallback', () => {
  for (const value of [undefined, '', 'javascript:alert(1)', 'https://user:password@login.test.example/']) {
    if (value === undefined) delete process.env.LOGIN_FRONT_URL;
    else process.env.LOGIN_FRONT_URL = value;
    const response = middleware(page());
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});

test('document refusal does not change cookies and non-GET documents do not replay bodies', () => {
  process.env.COOKIE_DOMAIN = '.test.example';
  const response = middleware(page({ accessToken: jwt(1) }, '/', 'POST'));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('metadata with dotted paths is explicitly covered without broadening static-asset matching', () => {
  assert.ok(config.matcher.includes('/openapi.json'));
  assert.ok(config.matcher.includes('/swagger.json'));
  assert.ok(config.matcher.some(value => value.includes('_next/static') && value.includes('.*\\..*')));
  for (const pathname of ['/openapi.json', '/swagger.json']) {
    const response = middleware(page({}, pathname));
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get('location')).searchParams.get('redirect'), ORIGIN + pathname);
    assert.equal(mock.requests.length, 0);
  }
});

test('an expired document keeps its canonical query for the Login owner recovery', () => {
  const response = middleware(page({ accessToken: jwt(1) }, '/?tab=security'));
  assert.equal(response.status, 307);
  const target = new URL(response.headers.get('location'));
  assert.equal(target.searchParams.get('redirect'), ORIGIN + '/?tab=security');
  assert.equal(target.searchParams.get('resumeSession'), '1');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(mock.requests.length, 0);
});

test('valid cookie reaches the unchanged contract proxy; a real upstream 401 is not accepted as success', async () => {
  front.cookies.accessToken = jwt(4102444800);
  mock.on('GET', '/settings/bootstrap', { body: fixtures.bootstrap() });
  assert.deepEqual(await loadSettings(), fixtures.bootstrap());
  assert.equal(mock.requests[0].headers.authorization, `Bearer ${front.cookies.accessToken}`);
  mock.on('PATCH', '/settings/profile', { status: 401, body: fixtures.error('Session refusée'), outOfContract: true });
  await assert.rejects(saveProfile({ first_name: 'Refused draft' }), { message: 'Votre session a expiré. Veuillez vous reconnecter.' });
  assert.equal(destinations.length, 1);
  assert.equal(new URL(destinations[0]).searchParams.get('redirect'), ORIGIN + '/');
  assert.equal(mock.calls('/settings/profile', 'PATCH').length, 1);
});

for (const status of [400, 403, 503]) {
  test(`${status} is a business/service refusal, not a Login redirect or automatic write replay`, async () => {
    front.cookies.accessToken = fixtures.ACCESS_TOKEN;
    mock.on('PATCH', '/settings/profile', { status, body: fixtures.error('Refus distinct'), outOfContract: true });
    await assert.rejects(saveProfile({ first_name: 'Draft' }), { message: 'Refus distinct' });
    assert.deepEqual(destinations, []);
    assert.equal(mock.calls('/settings/profile', 'PATCH').length, 1);
  });
}

test('a read aborted before its 401 is consumed cannot navigate a now-unmounted page', async () => {
  front.cookies.accessToken = fixtures.ACCESS_TOKEN;
  mock.on('GET', '/settings/bootstrap', { status: 401, body: fixtures.error('Late refusal'), outOfContract: true });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadSettings(controller.signal), { name: 'AbortError' });
  assert.deepEqual(destinations, []);
  assert.equal(mock.requests.length, 0);
});

test('a read aborted while receiving a 401 cannot navigate after unmount', async () => {
  front.cookies.accessToken = fixtures.ACCESS_TOKEN;
  const controller = new AbortController();
  mock.on('GET', '/settings/bootstrap', () => {
    controller.abort();
    return { status: 401, body: fixtures.error('Late refusal'), outOfContract: true };
  });
  await assert.rejects(loadSettings(controller.signal), { name: 'AbortError' });
  assert.equal(mock.requests.length, 1);
  assert.deepEqual(destinations, []);
});

test('unavailable browser Login on a real 401 shows a controlled failure without an unsafe navigation', async () => {
  front.cookies.accessToken = fixtures.ACCESS_TOKEN;
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'javascript:alert(1)' });
  mock.on('GET', '/settings/bootstrap', { status: 401, body: fixtures.error('Session refusée'), outOfContract: true });
  await assert.rejects(loadSettings(), { message: 'Votre session a expiré. Veuillez vous reconnecter.' });
  assert.deepEqual(destinations, []);
});
