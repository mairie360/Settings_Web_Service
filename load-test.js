import http from 'k6/http';
import { check, sleep, group } from 'k6';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

// ---------------------------------------------------------------------------
// k6 load test of the Settings front (Settings_Web_Service).
// Two scenarios run side by side against the routes the Next.js server really serves:
//   * `reads`: the page (Next.js render), /health, then the /api/bff/settings/bootstrap aggregation
//     the page fetches, relayed by the same-origin proxy to BFF Settings;
//   * `writes` (MAIR-516): the general preferences update a user saves from the page,
//     PATCH /api/bff/settings/general (-> BFF Settings -> Core API), idempotent on purpose.
// Authentication goes through the accessToken cookie, like in the browser: the proxy turns it
// into Authorization: Bearer for the BFF.
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
// Doit correspondre au JWT_SECRET des services core-api / bff-settings de la stack de test.
const JWT_SECRET = __ENV.JWT_SECRET || 'b"secret"';
// User inserted by init-test.sql (token `sub`).
const USER_ID = __ENV.PERF_USER_ID || '2';

const STAGES = [
  { duration: '30s', target: 20 }, // ramp up
  { duration: '1m', target: 20 }, // plateau
  { duration: '10s', target: 0 }, // ramp down
];

export const options = {
  scenarios: {
    reads: { executor: 'ramping-vus', startVUs: 0, stages: STAGES, exec: 'reads', gracefulRampDown: '5s' },
    // Few VUs on purpose: every iteration writes the user's preferences in the Core API database.
    writes: { executor: 'constant-vus', vus: 3, duration: '1m40s', exec: 'writes' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // < 1% of HTTP errors
    checks: ['rate>0.99'], // a redirect (307) is not an HTTP error: the checks catch it
    'http_req_duration{endpoint:page}': ['p(95)<800'], // Next.js page render
    'http_req_duration{endpoint:health}': ['p(95)<150'], // same-origin proxy -> BFF /health
    'http_req_duration{endpoint:settings}': ['p(95)<600'], // proxy + BFF aggregation + upstream
    'http_req_duration{endpoint:settings-write}': ['p(95)<800'], // proxy -> BFF Settings -> Core API update
  },
};

function b64url(value) {
  return encoding.b64encode(value, 'rawurl');
}

// JWT HS256 minimal accepté par Core API (claims sub + role + exp).
function mintJwt() {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ sub: USER_ID, role: 'user', exp: now + 3600 }));
  const signingInput = `${header}.${payload}`;
  const signature = crypto.hmac('sha256', JWT_SECRET, signingInput, 'base64rawurl');
  return `${signingInput}.${signature}`;
}

export function setup() {
  return { token: mintJwt() };
}

export function reads(data) {
  const cookie = { Cookie: `accessToken=${data.token}` };
  // redirects: 0 : a redirect (e.g. to the Login front when the cookie is refused)
  // must fail the check instead of being followed outside the stack.
  const pageParams = { headers: cookie, redirects: 0, tags: { endpoint: 'page' } };
  const dataParams = { headers: { ...cookie, Accept: 'application/json' }, redirects: 0, tags: { endpoint: 'settings' } };

  group('pages', () => {
    const home = http.get(`${BASE_URL}/`, pageParams);
    check(home, { 'page / 200': (r) => r.status === 200 });
  });

  group('health', () => {
    const res = http.get(`${BASE_URL}/health`, { headers: cookie, redirects: 0, tags: { endpoint: 'health' } });
    check(res, { 'health 200': (r) => r.status === 200 });
  });

  group('settings reads', () => {
    // Browser path of the page (src/lib/bff-client.ts prefixes /api/bff), not the root catch-all.
    const settingsBootstrap = http.get(`${BASE_URL}/api/bff/settings/bootstrap`, dataParams);
    check(settingsBootstrap, { '/api/bff/settings/bootstrap 200': (r) => r.status === 200 });
  });

  sleep(1);
}

export function writes(data) {
  const headers = { Cookie: `accessToken=${data.token}`, Accept: 'application/json', 'Content-Type': 'application/json' };

  group('settings write', () => {
    // Alternate between two valid values so every iteration really changes the stored preference.
    const timezone = __ITER % 2 === 0 ? 'Europe/Paris' : 'Europe/Brussels';
    const updated = http.patch(`${BASE_URL}/api/bff/settings/general`, JSON.stringify({ timezone }), {
      headers,
      redirects: 0,
      tags: { endpoint: 'settings-write' },
    });
    check(updated, {
      'PATCH /api/bff/settings/general 200': (r) => r.status === 200,
      'PATCH /api/bff/settings/general echoes the timezone': (r) => {
        try {
          return r.json().timezone === timezone;
        } catch {
          return false;
        }
      },
    });
  });

  sleep(1);
}
