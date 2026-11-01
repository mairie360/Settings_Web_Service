const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const { NextRequest } = require('next/server');
const { requireSrc } = require('./support/load-ts.cjs');
const { proxyBffRequest, forwardToBff } = requireSrc('lib/bff-proxy.ts');
const originalFetch = global.fetch;
for (const [name, target, headers, expected] of [
  ['unknown route', '/not-published', {}, 404],
  ['cross-site mutation', '/settings/profile', { 'sec-fetch-site': 'cross-site' }, 403],
  ['oversized declared body', '/settings/profile', { 'content-length': String(2 * 1024 * 1024) }, 413],
]) test(`relay rejects ${name} before any unbounded body allocation`, async () => {
  global.fetch = async () => assert.fail('a rejected request cannot reach the BFF');
  const request = new NextRequest('http://localhost' + target, {
    method: 'PATCH', headers: { 'content-type': 'application/json', cookie: 'accessToken=test-session', ...headers }, body: '{}',
  });
  request.arrayBuffer = async () => assert.fail('the relay must not prebuffer the complete request');
  const response = await forwardToBff(request, 'http://bff.example', target);
  assert.equal(response.status, expected);
});
const originalBffUrl = process.env.SETTINGS_BFF_URL;
afterEach(() => {
  global.fetch = originalFetch;
  if (originalBffUrl === undefined) delete process.env.SETTINGS_BFF_URL;
  else process.env.SETTINGS_BFF_URL = originalBffUrl;
});

test('published Settings relay preserves query and status but authenticates only from cookies', async () => {
  process.env.SETTINGS_BFF_URL = 'http://bff.example';
  let called;
  global.fetch = async (url, init) => { called = { url: String(url), init }; return Response.json({ value: null }, { status: 201 }); };
  const request = new NextRequest('http://localhost/settings/bootstrap?q=a%26b', { headers: { cookie: 'accessToken=test-session', Authorization: 'Bearer untrusted-browser' } });
  const response = await proxyBffRequest(request, { params: Promise.resolve({ path: ['settings', 'bootstrap'] }) });
  assert.equal(response.status, 201); assert.deepEqual(await response.json(), { value: null });
  assert.equal(new URL(called.url).pathname, '/settings/bootstrap');
  assert.equal(new URL(called.url).search, '?q=a%26b'); assert.equal(called.init.headers.get('Authorization'), 'Bearer test-session');
  assert.equal(called.init.headers.get('cookie'), null); assert.equal(called.init.redirect, 'manual');
});
test('published profile mutation preserves exact body bytes and 204 responses', async () => {
  const bytes = new TextEncoder().encode('{ "first_name": "Élodie" }');
  let init;
  global.fetch = async (_url, options) => { init = options; return new Response(null, { status: 204 }); };
  const request = new NextRequest('http://localhost/settings/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', cookie: 'accessToken=test-session' }, body: bytes });
  const response = await forwardToBff(request, 'http://bff.example', '/settings/profile');
  assert.equal(response.status, 204); assert.equal(await response.text(), '');
  assert.deepEqual(new Uint8Array(init.body), bytes); assert.equal(init.headers.get('Authorization'), 'Bearer test-session');
  assert.equal(init.headers.get('Content-Type'), 'application/json');
});
test('undeclared uploads, metadata and unknown operations cannot reach the BFF', async () => {
  global.fetch = async () => assert.fail('undeclared network operation');
  for (const path of [['files'], ['openapi.json'], ['swagger.json'], ['unknown']]) {
    const response = await proxyBffRequest(new NextRequest('http://localhost/' + path.join('/')), { params: Promise.resolve({ path }) });
    assert.equal(response.status, 404);
  }
  const wrongMethod = await proxyBffRequest(new NextRequest('http://localhost/health', { method: 'DELETE' }), { params: Promise.resolve({ path: ['health'] }) });
  assert.equal(wrongMethod.status, 405); assert.match(wrongMethod.headers.get('Allow'), /GET/);
});
test('business errors are preserved but the Settings BFF cannot replace shared session cookies', async () => {
  global.fetch = async () => Response.json({ message: 'Denied' }, { status: 403, headers: { 'Set-Cookie': 'accessToken=untrusted; Path=/; HttpOnly' } });
  const result = await forwardToBff(new NextRequest('http://localhost/settings/bootstrap'), 'http://bff.example', '/settings/bootstrap');
  assert.equal(result.status, 403); assert.deepEqual(await result.json(), { message: 'Denied' }); assert.equal(result.headers.get('Set-Cookie'), null);
});
test('unavailable BFF produces a controlled error', async () => {
  global.fetch = async () => { throw new Error('connection refused'); };
  const result = await forwardToBff(new NextRequest('http://localhost/health'), 'http://bff.example', '/health');
  assert.equal(result.status, 502); assert.equal(result.headers.get('Cache-Control'), 'no-store');
});
