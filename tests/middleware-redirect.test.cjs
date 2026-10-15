const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const { NextRequest } = require('next/server');
const { requireSrc } = require('./support/load-ts.cjs');
const { middleware } = requireSrc('middleware.ts');
const { ACCESS_TOKEN } = require('./support/settings-fixtures.cjs');
const variables = ['SETTINGS_FRONT_URL', 'LOGIN_FRONT_URL'];
let previous;
beforeEach(() => {
  previous = Object.fromEntries(variables.map(name => [name, process.env[name]]));
  process.env.SETTINGS_FRONT_URL = 'https://settings.mairie.test';
  process.env.LOGIN_FRONT_URL = 'https://login.mairie.test';
});
afterEach(() => { for (const [name, value] of Object.entries(previous)) if (value === undefined) delete process.env[name]; else process.env[name] = value; });
const request = (path = '/', { method = 'GET', token } = {}) => new NextRequest('https://untrusted-host.test' + path, { method, headers: token ? { Cookie: `accessToken=${token}` } : {} });
const jwt = exp => `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`;

for (const [name, token] of [['missing', undefined], ['opaque', 'opaque'], ['expired', jwt(1)], ['non-numeric expiry', jwt('future')], ['missing expiry', jwt(undefined)], ['broken JSON', 'header.invalid.signature']]) test(`the Settings document guard sends a ${name} session to its own resume handler`, () => {
  const response = middleware(request('/?tab=notification-preferences&event=1', { token }));
  assert.equal(response.status, 307); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const destination = new URL(response.headers.get('Location'));
  assert.equal(destination.origin, 'https://settings.mairie.test'); assert.equal(destination.pathname, '/api/auth/resume');
  assert.equal(destination.searchParams.get('next'), '/?tab=notification-preferences&event=1');
});
for (const [path, method] of [['/settings/bootstrap', 'GET'], ['/settings/notifications', 'PATCH'], ['/', 'POST']]) test(`the guard reports an expired ${method} ${path} as JSON instead of replaying the write`, async () => {
  const response = middleware(request(path, { method }));
  assert.equal(response.status, 401); assert.equal(response.headers.get('Location'), null); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { error: { message: 'Votre session a expiré. Veuillez vous reconnecter.' } });
});
for (const path of ['/openapi.json', '/swagger.json']) test(`the Settings guard rejects undeclared metadata ${path} before document rendering`, () => {
  assert.equal(middleware(request(path, { token: ACCESS_TOKEN })).status, 404);
});
test('a current Settings session reaches the page with a fresh nonce-bound policy on each request', () => {
  const first = middleware(request('/', { token: ACCESS_TOKEN })); const second = middleware(request('/', { token: ACCESS_TOKEN }));
  assert.equal(first.headers.get('x-middleware-next'), '1'); assert.equal(first.headers.get('Location'), null);
  const policy = first.headers.get('Content-Security-Policy'); assert.ok(policy.includes("connect-src 'self'")); assert.match(policy, /'nonce-[^']+'/);
  assert.notEqual(policy, second.headers.get('Content-Security-Policy'));
});
test('a missing canonical Settings origin fails closed without redirecting to the request host', () => {
  delete process.env.SETTINGS_FRONT_URL;
  const response = middleware(request('/'));
  assert.equal(response.status, 503); assert.equal(response.headers.get('Location'), null); assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
