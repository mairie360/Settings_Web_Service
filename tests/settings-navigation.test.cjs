const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');
const { readFrontUrlsFromEnv, setBrowserFrontUrls } = requireSrc('lib/front-urls.ts');
const { FrontUrlsProvider } = requireSrc('lib/front-urls-provider.tsx');
const { getActiveFrontHrefs } = requireSrc('lib/navigation.ts');

afterEach(() => {
  delete process.env.DASHBOARD_FRONT_URL;
  setBrowserFrontUrls({});
  delete global.window;
});

test('server layout reads configured frontend destinations at runtime', () => {
  process.env.DASHBOARD_FRONT_URL = 'https://dashboard.example.test/';
  assert.equal(readFrontUrlsFromEnv().DASHBOARD_FRONT_URL, 'https://dashboard.example.test/');
});

test('shared shell exposes only valid, active destinations and the current profile', () => {
  global.window = {};
  setBrowserFrontUrls({
    DASHBOARD_FRONT_URL: 'https://dashboard.example.test/',
    PROJECT_FRONT_URL: 'javascript:alert(1)',
    MESSAGE_FRONT_URL: 'https://name:secret@messages.example.test/',
  });

  assert.deepEqual(getActiveFrontHrefs(), {
    dashboard: 'https://dashboard.example.test/',
    projects: undefined,
    messages: undefined,
    training: undefined,
    calendar: undefined,
    admin: undefined,
    settings: '/',
    profile: '/',
  });
});

test('the root provider gives child navigation its runtime destinations before rendering', () => {
  global.window = {};
  const child = { type: 'child' };

  assert.equal(FrontUrlsProvider({
    urls: { DASHBOARD_FRONT_URL: 'https://dashboard.example.test/' },
    children: child,
  }), child);
  assert.equal(getActiveFrontHrefs().dashboard, 'https://dashboard.example.test/');
});
