const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');

const { logoutAndRedirect } = requireSrc('lib/logout.ts');
const { setBrowserFrontUrls } = requireSrc('lib/front-urls.ts');

const originalFetch = global.fetch;
beforeEach(() => {
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'https://login.test.example/' });
  global.window = { location: { replace() {} } };
});
afterEach(() => {
  global.fetch = originalFetch;
  delete global.window;
});

test('logout hands off to the Login frontend without a second BFF call', async () => {
  const requests = [];
  const destinations = [];
  global.fetch = async (...args) => { requests.push(args); throw new Error('unexpected network call'); };
  global.window.location.replace = (href) => destinations.push(href);

  await logoutAndRedirect();

  assert.deepEqual(requests, []);
  assert.deepEqual(destinations, ['https://login.test.example/logout']);
});

test('invalid Login URL never navigates', async () => {
  const destinations = [];
  global.window.location.replace = (href) => destinations.push(href);
  global.fetch = () => assert.fail('no request without a valid Login destination');
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'javascript:alert(1)' });
  await assert.rejects(logoutAndRedirect(), /Login frontend URL/);

  assert.deepEqual(destinations, []);
});
