const assert = require('node:assert/strict');
const { test, before, after, beforeEach, afterEach } = require('node:test');
const path = require('node:path');
const { NextRequest } = require('next/server');
const { createSessionRefreshHandler, createSessionLogoutHandler, proxyPublishedBffRequest, forgetUserSession } = require('@mairie360/lib-components/next');
const { ROOT, requireSrc } = require('./support/load-ts.cjs');
const { OpenApiContract } = require('./support/openapi-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { createFront, ORIGIN } = require('./support/front-harness.cjs');
const fixtures = require('./support/settings-fixtures.cjs');

const userContract = OpenApiContract.load(path.join(__dirname, 'fixtures/user-session-openapi.json'));
const settings = new ContractMockServer('SETTINGS', OpenApiContract.load(path.join(ROOT, 'contracts/openapi.json')));
const user = new ContractMockServer('LOGIN_USER', userContract);
const owner = { origin: 'https://login.mairie.test', calls: [] };
const cookies = {};
const front = createFront({ cookies, upstreams: () => [settings.url, user.url], owner });
const client = requireSrc('lib/bff-client.ts');
const roleClient = requireSrc('lib/session-role.ts');
const logout = requireSrc('lib/logout.ts');
const { setBrowserFrontUrls } = requireSrc('lib/front-urls.ts');
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const jwt = exp => `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: '1', exp })}.signature`;
let access, refresh, browser;
const me = name => ({ user: { id: 1, first_name: 'Anne', last_name: 'Le Gall', email: 'anne@mairie.test', phone: null, status: 'active' }, groups: [], roles: [{ id: 1, name }] });
const refusal = status => ({ status, body: { message: 'Disposable refusal' }, outOfContract: true });
before(async () => {
  await settings.start(); await user.start(); front.install();
  const config = { userBffUrl: () => user.url, cookieOptions: () => ({ secure: false }), allowedOrigins: () => [ORIGIN, owner.origin] };
  const handlers = { '/api/auth/refresh': createSessionRefreshHandler(config), '/api/auth/logout': createSessionLogoutHandler(config) };
  owner.handle = request => {
    if (owner.override) return owner.override(request);
    if (request.nextUrl.pathname === '/api/bff/me') return proxyPublishedBffRequest(request, ['me'], { baseUrl: () => user.url, paths: userContract.document.paths, frontUrl: () => owner.origin, loginUrl: () => owner.origin });
    const handler = handlers[request.nextUrl.pathname];
    if (!handler) throw new Error('Undeclared Login operation');
    return handler(request);
  };
});
after(async () => { front.uninstall(); await settings.stop(); await user.stop(); delete global.window; });
beforeEach(() => {
  settings.reset(); user.reset(); front.reset(); owner.calls.length = 0; owner.override = undefined;
  access = jwt(Math.floor(Date.now() / 1000) + 3600); refresh = 'disposable-settings-' + Math.random();
  cookies.accessToken = jwt(1); cookies.refreshToken = refresh;
  process.env.SETTINGS_BFF_URL = settings.url; process.env.LOGIN_FRONT_URL = owner.origin;
  setBrowserFrontUrls({ SETTINGS_FRONT_URL: ORIGIN, LOGIN_FRONT_URL: owner.origin });
  browser = { location: { origin: ORIGIN, pathname: '/', search: '?tab=profile', href: ORIGIN + '/?tab=profile', assigned: [], assign(href) { this.assigned.push(href); } } };
  global.window = browser;
});
afterEach(() => {
  forgetUserSession(user.url, refresh); forgetUserSession(user.url, cookies.refreshToken);
  const violations = [...settings.violations, ...user.violations, ...front.violations];
  settings.reset(); user.reset(); front.reset(); delete global.window;
  assert.deepEqual(violations, []);
});
const renewed = () => user.on('POST', '/auth/refresh', { body: { message: 'JWT refreshed successfully' }, headers: { 'Set-Cookie': [
  `accessToken=${access}; Path=/auth; Max-Age=3600; HttpOnly; SameSite=Strict`,
  `refreshToken=renewed-${refresh}; Path=/auth; HttpOnly; SameSite=Strict`,
] } });
const business = () => settings.on('GET', '/settings/bootstrap', req => req.headers.authorization === `Bearer ${access}` ? { body: fixtures.bootstrap() } : refusal(401));

test('Settings renews once at Login and retries the actual bootstrap without browser-visible tokens', async () => {
  renewed(); business();
  assert.deepEqual(await client.requestBff('/settings/bootstrap'), fixtures.bootstrap());
  assert.deepEqual(front.browserCalls, [{ method: 'GET', path: '/api/bff/settings/bootstrap' }]);
  assert.equal(user.calls('/auth/refresh').length, 1);
  assert.deepEqual(user.calls('/auth/refresh')[0].body, { refresh_token: refresh });
  assert.equal(user.calls('/auth/refresh')[0].headers.authorization, undefined);
  assert.equal(settings.requests.length, 2); assert.equal(cookies.accessToken, access);
  assert.deepEqual(browser.location.assigned, []);
});

test('parallel bootstrap and authoritative role reads share one owner rotation', async () => {
  renewed(); business();
  user.on('GET', '/me', req => req.headers.authorization === `Bearer ${access}` ? { body: me('Admin') } : refusal(401));
  const [data, admin] = await Promise.all([client.requestBff('/settings/bootstrap'), roleClient.loadSessionRole(new AbortController().signal)]);
  assert.ok(data.profile); assert.equal(admin, true); assert.equal(user.calls('/auth/refresh').length, 1);
  assert.equal(user.calls('/me').length, 2); assert.equal(settings.requests.length, 2);
  assert.equal(cookies.refreshToken, 'renewed-' + refresh);
});

for (const [name, expected] of [['Admin', true], ['administrateur', true], ['Responsable', false], ['User', false]]) test(`the authoritative User role ${name} yields administration navigation=${expected}`, async () => {
  cookies.accessToken = access;
  user.on('GET', '/me', { body: me(name) });
  assert.equal(await roleClient.loadSessionRole(new AbortController().signal), expected);
  assert.equal(user.requests.length, 1); assert.equal(user.requests[0].headers.authorization, `Bearer ${access}`);
  assert.equal(user.requests[0].headers.cookie, undefined); assert.equal(settings.requests.length, 0);
});

test('foreign role, data and logout requests never reach a service or mutate cookies', async () => {
  for (const [url, init] of [['/api/auth/role', {}], ['/api/bff/health', {}], ['/api/auth/logout', { method: 'POST', body: '{}' }]]) {
    const response = await fetch(url, { ...init, headers: { Origin: 'https://foreign.test', 'Content-Type': 'application/json' } });
    assert.equal(response.status, 403); assert.equal(response.headers.get('set-cookie'), null);
  }
  assert.equal(owner.calls.length, 0); assert.equal(user.requests.length, 0); assert.equal(settings.requests.length, 0);
  assert.equal(cookies.refreshToken, refresh);
});

for (const status of [401, 503]) test(`failed renewal${status} never revokes or replays the Settings write`, async () => {
  settings.on('PATCH', '/settings/profile', refusal(401));
  owner.override = () => Response.json({ message: 'Disposable refusal' }, { status });
  await assert.rejects(client.requestBff('/settings/profile', { method: 'PATCH', body: '{"first_name":"Draft"}' }));
  assert.equal(settings.requests.length, 1); assert.equal(user.calls('/auth/logout').length, 0); assert.equal(cookies.refreshToken, refresh);
  assert.equal(browser.location.assigned.length, status === 401 ? 1 : 0);
  if (status === 401) assert.equal(new URL(browser.location.assigned[0]).searchParams.get('redirect'), browser.location.href);
});

test('unconfirmed owner logout leaves a deliberate return choice and never calls a Settings logout operation', async () => {
  cookies.accessToken = access;
  user.on('POST', '/auth/logout', { body: { message: 'No server revocation', session_revoked: false } });
  await assert.rejects(logout.logoutAndRedirect(), /déconnexion n’a pas été confirmée/);
  assert.equal(user.calls('/auth/logout').length, 1); assert.equal(settings.requests.length, 0);
  assert.deepEqual(browser.location.assigned, []); assert.equal(logout.isSessionRecoveryPending(), true);
  assert.equal(logout.navigateToLogin(), false);
  assert.equal(logout.navigateToLogin({ explicit: true }), true);
  assert.equal(new URL(browser.location.assigned[0]).searchParams.get('redirect'), browser.location.href);
});

test('a refused authoritative role read returns to canonical Login without invoking logout', async () => {
  cookies.accessToken = access; delete cookies.refreshToken;
  user.on('GET', '/me', refusal(401));
  assert.equal(await roleClient.loadSessionRole(new AbortController().signal), false);
  assert.equal(browser.location.assigned.length, 1);
  assert.equal(new URL(browser.location.assigned[0]).searchParams.get('redirect'), browser.location.href);
  assert.equal(user.calls('/auth/logout').length, 0); assert.equal(settings.requests.length, 0);
});
test('the role relay never accepts a browser bearer or leaks unrelated cookies to Login', async () => {
  cookies.accessToken = access; cookies.unrelated = 'private-unrelated';
  user.on('GET', '/me', { body: me('Admin') });
  const handler = owner.handle; let ownerRequest;
  owner.handle = request => { ownerRequest = request; return handler(request); };
  try {
    const response = await fetch('/api/auth/role', { headers: { Authorization: 'Bearer browser-forgery' } });
    assert.deepEqual(await response.json(), { isAdmin: true });
    assert.equal(ownerRequest.nextUrl.pathname, '/api/bff/me');
    assert.equal(ownerRequest.headers.get('authorization'), null);
    assert.doesNotMatch(ownerRequest.headers.get('cookie'), /unrelated/);
    assert.equal(user.requests[0].headers.authorization, `Bearer ${access}`);
  } finally { owner.handle = handler; delete cookies.unrelated; }
});
test('aborted role responses cannot trigger Login navigation on an unmounted page', async () => {
  const controller = new AbortController();
  owner.override = () => { controller.abort(); return Response.json({ message: 'Late refusal' }, { status: 401 }); };
  await assert.rejects(roleClient.loadSessionRole(controller.signal), { name: 'AbortError' });
  assert.deepEqual(browser.location.assigned, []);
});
