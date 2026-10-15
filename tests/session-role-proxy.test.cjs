const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const { NextRequest } = require('next/server');
const { requireSrc } = require('./support/load-ts.cjs');
const { sessionRole } = requireSrc('lib/session-role-proxy.ts');
const { ACCESS_TOKEN } = require('./support/settings-fixtures.cjs');
const variables = ['SETTINGS_FRONT_URL', 'LOGIN_FRONT_URL', 'NODE_ENV'];
let previous;
beforeEach(() => {
  previous = Object.fromEntries(variables.map(name => [name, process.env[name]]));
  process.env.SETTINGS_FRONT_URL = 'https://settings.mairie.test';
  process.env.LOGIN_FRONT_URL = 'https://login.mairie.test';
  process.env.NODE_ENV = 'test';
});
afterEach(() => {
  for (const [name, value] of Object.entries(previous)) if (value === undefined) delete process.env[name]; else process.env[name] = value;
});
const request = (headers = {}) => new NextRequest('https://settings.mairie.test/api/auth/role', { headers: { Cookie: `accessToken=${ACCESS_TOKEN}; refreshToken=refresh; unrelated=private`, ...headers } });
const reply = body => Response.json(body);
const assertUnavailable = async (response, status) => {
  assert.equal(response.status, status); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { message: 'Les informations du profil sont indisponibles.' });
};

for (const [name, configure, headers, status] of [
  ['missing Settings origin', () => delete process.env.SETTINGS_FRONT_URL, {}, 503],
  ['missing Login origin', () => delete process.env.LOGIN_FRONT_URL, {}, 503],
  ['cross-site request', () => {}, { 'sec-fetch-site': 'cross-site' }, 403],
  ['untrusted browser origin', () => {}, { Origin: 'https://other.mairie.test' }, 403],
  ['insecure production Login', () => { process.env.NODE_ENV = 'production'; process.env.LOGIN_FRONT_URL = 'http://login.mairie.test'; }, {}, 503],
]) test(`role relay refuses ${name} before contacting Login`, async t => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected network call'); });
  configure(); await assertUnavailable(await sessionRole(request(headers)), status);
  assert.equal(fetch.mock.callCount(), 0);
});

for (const [name, body, isAdmin] of [
  ['primary role', { user: { role: 'ROLE_Administrator' } }, true],
  ['user role list', { user: { roles: [{ name: ' administrateur ' }] } }, true],
  ['top-level role list', { user: {}, roles: ['Admin'] }, true],
  ['regular user', { user: {}, roles: [{ name: 'Responsable' }] }, false],
  ['empty roles', { user: {} }, false],
  ['untrusted roles', { user: { roles: [null, false, {}, { name: 42 }, 'super-admin'] } }, false],
  ['explicit primary role', { user: { role: 'User', roles: ['Admin'] }, roles: ['Admin'] }, false],
]) test(`role relay reads ${name} from the authoritative response`, async t => {
  t.mock.method(globalThis, 'fetch', async () => reply(body));
  const response = await sessionRole(request({ Origin: 'https://settings.mairie.test' }));
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { isAdmin });
});

test('role relay forwards only session cookies and trusted response rotations', async t => {
  const responseHeaders = new Headers(); responseHeaders.append('Set-Cookie', 'accessToken=new; Path=/; HttpOnly'); responseHeaders.append('Set-Cookie', 'refreshToken=next; Path=/; HttpOnly');
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ user: { role: 'Admin' } }, { headers: responseHeaders }));
  const response = await sessionRole(request({ Authorization: 'Bearer browser-injection' }));
  const [url, init] = fetch.mock.calls[0].arguments;
  assert.equal(url.href, 'https://login.mairie.test/me');
  assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'manual'); assert.ok(init.signal instanceof AbortSignal);
  assert.deepEqual(init.headers, { Accept: 'application/json', 'Sec-Fetch-Site': 'same-site', Cookie: `accessToken=${ACCESS_TOKEN}; refreshToken=refresh` });
  assert.deepEqual(response.headers.getSetCookie(), responseHeaders.getSetCookie());
});

for (const status of [302, 401, 403, 503]) test(`role relay does not turn HTTP ${status} into an administrator`, async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status }));
  await assertUnavailable(await sessionRole(request()), status >= 400 ? status : 502);
});
for (const body of [null, {}, { user: null }, { user: 'Admin' }]) test(`role relay rejects a malformed response ${JSON.stringify(body)}`, async t => {
  t.mock.method(globalThis, 'fetch', async () => reply(body));
  await assertUnavailable(await sessionRole(request()), 502);
});
test('role relay fails closed on network and invalid JSON errors', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Private network error'); });
  await assertUnavailable(await sessionRole(request()), 502);
  fetch.mock.mockImplementation(async () => new Response('not JSON', { status: 200 }));
  await assertUnavailable(await sessionRole(request()), 502);
});
