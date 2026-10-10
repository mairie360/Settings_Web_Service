const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');
const { logoutAndRedirect, navigateToLogin, isSessionRecoveryPending } = requireSrc('lib/logout.ts');
const { setBrowserFrontUrls } = requireSrc('lib/front-urls.ts');
const originalFetch = global.fetch;
let requests, destinations;
beforeEach(() => {
  requests = []; destinations = [];
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'https://login.test.example/', SETTINGS_FRONT_URL: 'https://settings.test.example/' });
  global.window = { location: { origin: 'https://settings.test.example', pathname: '/', search: '?tab=security', assign: href => destinations.push(href) } };
});
afterEach(() => { global.fetch = originalFetch; delete global.window; setBrowserFrontUrls({}); });

test('confirmed logout uses one same-origin POST before canonical Login navigation', async () => {
  global.fetch = async (...args) => { requests.push(args); return Response.json({ message: 'Session revoked', session_revoked: true }); };
  await logoutAndRedirect();
  assert.equal(requests.length, 1); assert.equal(requests[0][0], '/api/auth/logout');
  assert.equal(requests[0][1].method, 'POST'); assert.equal(requests[0][1].credentials, 'same-origin');
  assert.equal(requests[0][1].redirect, 'manual'); assert.equal(requests[0][1].cache, 'no-store');
  assert.deepEqual(JSON.parse(requests[0][1].body), {});
  assert.equal(new URL(destinations[0]).searchParams.get('redirect'), 'https://settings.test.example/?tab=security');
});
for (const [label, response] of [
  ['false receipt', () => Response.json({ message: 'Unconfirmed', session_revoked: false })],
  ['message-only receipt', () => Response.json({ message: 'Unconfirmed' })],
  ['service refusal', () => Response.json({ message: 'Unavailable' }, { status: 503 })],
  ['network failure', () => { throw new Error('Unavailable'); }],
]) test(`${label} retains an explicit return choice and prevents a late automatic handoff`, async () => {
  global.fetch = response;
  await assert.rejects(logoutAndRedirect(), /déconnexion n’a pas été confirmée/);
  assert.deepEqual(destinations, []); assert.equal(isSessionRecoveryPending(), true);
  assert.equal(navigateToLogin(), false); assert.deepEqual(destinations, []);
  assert.equal(navigateToLogin({ explicit: true }), true);
  assert.equal(new URL(destinations[0]).searchParams.get('redirect'), 'https://settings.test.example/?tab=security');
});
test('invalid Login URL prevents navigation even after a confirmed receipt', async () => {
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'javascript:alert(1)' });
  global.fetch = async () => Response.json({ message: 'Session revoked', session_revoked: true });
  await assert.rejects(logoutAndRedirect(), /retour à la connexion est indisponible/);
  assert.deepEqual(destinations, []); assert.equal(isSessionRecoveryPending(), true);
});
