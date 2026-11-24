import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ---------------------------------------------------------------------------
// k6 load test of the Settings front (Settings_Web_Service).
// Two scenarios run side by side against the routes the Next.js server really serves:
//   * `reads`: the page (Next.js render), /health, then the /settings/bootstrap aggregation
//     the page fetches, relayed by the same-origin proxy to BFF Settings;
//   * `writes` (MAIR-516): the general preferences update a user saves from the page,
//     PATCH /settings/general (-> BFF Settings -> Core API), idempotent on purpose.
// Authentication goes through the accessToken cookie, like in the browser: the proxy turns it
// into Authorization: Bearer for the BFF.
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
// Session of the user of init-test.sql (sub=2): an EdDSA JWT signed like Core by stack_secrets.sh with
// the run's key (MAIR-680). k6 cannot sign Ed25519, so the token is passed in.
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN;

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

function sessionToken() {
  if (!ACCESS_TOKEN) throw new Error('ACCESS_TOKEN is not set: run ./performance_test.sh, which signs it.');
  return ACCESS_TOKEN;
}

export function setup() {
  return { token: sessionToken() };
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
    // Browser path of the page (src/lib/bff-client.ts calls the BFF path as is), not the root catch-all.
    const settingsBootstrap = http.get(`${BASE_URL}/settings/bootstrap`, dataParams);
    check(settingsBootstrap, { '/settings/bootstrap 200': (r) => r.status === 200 });
  });

  sleep(1);
}

export function writes(data) {
  const headers = { Cookie: `accessToken=${data.token}`, Accept: 'application/json', 'Content-Type': 'application/json' };

  group('settings write', () => {
    // Alternate between two valid values so every iteration really changes the stored preference.
    const timezone = __ITER % 2 === 0 ? 'Europe/Paris' : 'Europe/Brussels';
    const updated = http.patch(`${BASE_URL}/settings/general`, JSON.stringify({ timezone }), {
      headers,
      redirects: 0,
      tags: { endpoint: 'settings-write' },
    });
    check(updated, {
      'PATCH /settings/general 200': (r) => r.status === 200,
      'PATCH /settings/general echoes the timezone': (r) => {
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
