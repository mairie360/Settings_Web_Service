const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const { NextRequest } = require('next/server');
const { requireSrc } = require('./support/load-ts.cjs');

const { POST } = requireSrc('app/api/auth/logout/route.ts');
const { logoutAndRedirect } = requireSrc('lib/logout.ts');
const { setBrowserFrontUrls } = requireSrc('lib/front-urls.ts');

const originalFetch = global.fetch;
const originalNodeEnv = process.env.NODE_ENV;
const originalCookieDomain = process.env.COOKIE_DOMAIN;

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  delete process.env.COOKIE_DOMAIN;
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'https://login.test.example/' });
  global.window = { location: { replace() {} } };
});
afterEach(() => {
  global.fetch = originalFetch;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalCookieDomain === undefined) delete process.env.COOKIE_DOMAIN;
  else process.env.COOKIE_DOMAIN = originalCookieDomain;
  delete global.window;
});

test('local logout expires only the shared accessToken cookie', () => {
  process.env.COOKIE_DOMAIN = '.dev.mairie360-eip.fr';
  const response = POST(new NextRequest('https://settings.dev.mairie360-eip.fr/api/auth/logout', { method: 'POST' }));

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('set-cookie'), /^accessToken=;/);
  assert.match(response.headers.get('set-cookie'), /Domain=\.dev\.mairie360-eip\.fr/i);
  assert.match(response.headers.get('set-cookie'), /Path=\//);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
});

test('production fails closed if the shared cookie domain is missing', () => {
  process.env.NODE_ENV = 'production';
  const response = POST(new NextRequest('https://settings.dev.mairie360-eip.fr/api/auth/logout', { method: 'POST' }));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('non-same-origin POST cannot trigger local logout', () => {
  process.env.COOKIE_DOMAIN = '.dev.mairie360-eip.fr';
  for (const site of ['same-site', 'cross-site']) {
    const response = POST(new NextRequest('https://settings.dev.mairie360-eip.fr/api/auth/logout', {
      method: 'POST', headers: { 'sec-fetch-site': site },
    }));
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('set-cookie'), null);
  }
});

test('logout only posts to the same-origin route and then replaces the page with Login', async () => {
  const requests = [];
  const destinations = [];
  global.fetch = async (path, init) => { requests.push({ path, init }); return new Response(null, { status: 204 }); };
  global.window.location.replace = (href) => destinations.push(href);

  await logoutAndRedirect();

  assert.deepEqual(requests.map(({ path, init }) => [path, init.method, init.credentials]), [['/api/auth/logout', 'POST', 'same-origin']]);
  assert.deepEqual(destinations, ['https://login.test.example/']);
});

test('invalid Login URL or refused cookie clear never navigates', async () => {
  const destinations = [];
  global.window.location.replace = (href) => destinations.push(href);
  global.fetch = () => assert.fail('no request without a valid Login destination');
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'javascript:alert(1)' });
  await assert.rejects(logoutAndRedirect(), /Login frontend URL/);

  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'https://login.test.example/' });
  global.fetch = async () => new Response(null, { status: 503 });
  await assert.rejects(logoutAndRedirect(), /Local logout failed/);
  assert.deepEqual(destinations, []);
});
