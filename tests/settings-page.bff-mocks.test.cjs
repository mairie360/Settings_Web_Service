const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, test } = require('node:test');
const path = require('node:path');
const { ROOT, requireSrc } = require('./support/load-ts.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');

// HTML of the settings page (src/app/page.tsx) rendered with react-dom/server against the mocked
// BFF_Settings: the real page is rendered, the hook state is kept between render passes
// (tests/support/server-view.cjs), so the markup reflects the bootstrap loaded through the contract-gated
// proxy and the profile saved with PATCH /settings/profile.

installReactRuntime();
const React = require('react');
const { OpenApiContract } = require('./support/openapi-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { createFront } = require('./support/front-harness.cjs');
const fixtures = require('./support/settings-fixtures.cjs');
const Home = requireSrc('app/page.tsx').default;

const bffSettings = new ContractMockServer('BFF_SETTINGS', OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json')));
const front = createFront({ cookies: { accessToken: fixtures.ACCESS_TOKEN }, upstreams: () => [bffSettings.url] });
const BFF_URL_VARIABLES = ['SETTINGS_BFF_URL', 'BFF_SETTINGS_BASE_URL'];
let view;

before(async () => {
  await bffSettings.start();
  front.install();
});
after(async () => {
  front.uninstall();
  await bffSettings.stop();
  for (const name of BFF_URL_VARIABLES) delete process.env[name];
});
beforeEach(() => {
  bffSettings.reset();
  front.reset();
  for (const name of BFF_URL_VARIABLES) delete process.env[name];
  process.env.SETTINGS_BFF_URL = bffSettings.url;
});
afterEach(() => {
  view?.unmount();
  view = undefined;
  assert.deepEqual([...front.violations, ...bffSettings.violations], []);
});

const upstream = () => bffSettings.requests.map((request) => `${request.method} ${request.template}`);

async function renderLoadedPage(body = fixtures.bootstrap()) {
  bffSettings.on('GET', '/settings/bootstrap', { body });
  view = mount(React.createElement(Home));
  return view.waitFor((html) => !html.includes('Chargement des paramètres'));
}

test('the first pass renders the loading state, the next one the profile form filled from GET /settings/bootstrap', async () => {
  bffSettings.on('GET', '/settings/bootstrap', { body: fixtures.bootstrap() });
  view = mount(React.createElement(Home));

  assert.equal(view.passes, 1);
  assert.match(view.html, /<h1[^>]*>Paramètres<\/h1>/);
  assert.match(view.html, /<p role="status">Chargement des paramètres…<\/p>/);
  assert.doesNotMatch(view.html, /<form/);

  const html = await view.waitFor((current) => !current.includes('Chargement des paramètres'));

  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
  assert.deepEqual(front.browserCalls, [{ method: 'GET', path: '/settings/bootstrap' }]);
  assert.match(html, /<nav role="tablist" aria-label="Paramètres"/);
  assert.match(html, /<button id="settings-tab-profile" type="button" role="tab" aria-selected="true" tabindex="0"[^>]*>Profil<\/button>/);
  assert.match(html, /<div role="tabpanel" id="settings-panel-profile" aria-labelledby="settings-tab-profile">/);
  assert.match(html, /<h2[^>]*>Informations personnelles<\/h2>/);
  assert.match(html, /<input[^>]*type="text"[^>]*required=""[^>]*value="Anne Marie"/);
  assert.match(html, /<input[^>]*type="email"[^>]*value="anne\.le-gall@mairie\.test"/);
  assert.match(html, /<input[^>]*type="tel"[^>]*value="\+33123456789"/);
  assert.match(html, /<button[^>]*type="submit"[^>]*disabled=""[^>]*>Enregistrer<\/button>/);
  assert.match(html, /Aucune modification à enregistrer\./);
  assert.doesNotMatch(html, /role="alert"/);
});

test('the security tab lists the sessions of the bootstrap, or their unavailability', async () => {
  await renderLoadedPage(fixtures.bootstrap({ sessions: [fixtures.session('s-1'), fixtures.session('s-2', { device_info: 'Chrome sur Android', ip_address: '198.51.100.7' })] }));

  await view.click('Sécurité');

  assert.match(view.html, /<button id="settings-tab-security" type="button" role="tab" aria-selected="true" tabindex="0"[^>]*>Sécurité<\/button>/);
  assert.match(view.html, /<h2[^>]*>Sessions<\/h2>/);
  assert.match(view.text(), /Firefox sur Linux — 192\.0\.2\.10 Créée le 2026-09-15T08:00:00Z · Expire le 2026-09-22T08:00:00Z/);
  assert.match(view.text(), /Chrome sur Android — 198\.51\.100\.7/);
  assert.doesNotMatch(view.html, /<form/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap'], 'changing tab does not call the BFF');

  view.unmount();
  await renderLoadedPage(fixtures.bootstrap({ sessions: [], sources: { sessions: 'unavailable' } }));
  await view.click('Sécurité');
  assert.match(view.text(), /Les sessions sont temporairement indisponibles\./);

  await view.click('Notifications');
  assert.match(view.html, /<h2[^>]*>Notifications<\/h2>/);
  assert.match(view.text(), /Fonctionnalité indisponible/);
  assert.match(view.text(), /préférences de notification ne sont pas encore exposées par le contrat BFF publié/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'GET /settings/bootstrap'], 'an unavailable tab does not call the BFF');
});

test('arrow, Home and End keys select and focus Settings tabs without a BFF call', async () => {
  await renderLoadedPage();
  const focused = [];
  const children = tabsForFocus(6, focused);
  const key = async (label, pressed) => view.fire(
    (props, text) => props.role === 'tab' && text === label,
    'onKeyDown',
    { key: pressed, currentTarget: { parentElement: { children } } },
  );

  await key('Profil', 'ArrowRight');
  assert.match(view.html, /id="settings-panel-security"/);
  assert.deepEqual(focused, [1]);
  await key('Sécurité', 'End');
  assert.match(view.html, /id="settings-panel-system"/);
  assert.deepEqual(focused, [1, 5]);
  await key('Système', 'ArrowRight');
  assert.match(view.html, /id="settings-panel-profile"/);
  assert.deepEqual(focused, [1, 5, 0]);
  await key('Profil', 'Home');
  assert.deepEqual(focused, [1, 5, 0, 0]);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
});

function tabsForFocus(count, focused) {
  return Array.from({ length: count }, (_, index) => ({ focus() { focused.push(index); } }));
}

test('editing a field and submitting the form saves the profile with PATCH /settings/profile', async () => {
  await renderLoadedPage();
  const saved = fixtures.profile({ first_name: 'Anne', last_name: 'LE GALL' });
  bffSettings.on('PATCH', '/settings/profile', { body: saved });

  await view.fire((props) => props.type === 'text' && props.value === 'Anne Marie', 'onChange', { target: { value: 'Anne' } });
  assert.match(view.html, /<input[^>]*type="text"[^>]*value="Anne"/);
  assert.doesNotMatch(view.html, /value="Anne Marie"/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap'], 'typing does not call the BFF');

  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  const html = await view.waitFor((current) => current.includes('role="status"'));

  assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'PATCH /settings/profile']);
  assert.deepEqual(bffSettings.requests[1].body, { first_name: 'Anne' });
  assert.match(html, /<p role="status"[^>]*>Votre profil a été enregistré\.<\/p>/);
  assert.match(html, /<input[^>]*type="text"[^>]*value="LE GALL"/);
  assert.match(html, /<button[^>]*type="submit"[^>]*disabled=""[^>]*>Enregistrer<\/button>/, 'the button is disabled again');
  assert.match(html, /Aucune modification à enregistrer\./);
});

test('a refused save keeps the form and shows the BFF message', async () => {
  await renderLoadedPage();
  bffSettings.on('PATCH', '/settings/profile', { status: 400, body: fixtures.error('Numéro de téléphone invalide'), outOfContract: true });

  await view.fire((props) => props.type === 'tel', 'onChange', { target: { value: 'invalide' } });
  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  const html = await view.waitFor((current) => current.includes('role="alert"'));

  assert.match(html, /<p role="alert"[^>]*>Numéro de téléphone invalide<\/p>/);
  assert.match(html, /value="Anne Marie"/);
  assert.doesNotMatch(html, /role="status"/);
  assert.deepEqual(bffSettings.requests[1].body, { phone: 'invalide' });
});

test('submitting an unchanged profile never calls the BFF', async () => {
  await renderLoadedPage();

  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');

  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
  assert.doesNotMatch(view.html, /Votre profil a été enregistré/);
  assert.match(view.html, /Aucune modification à enregistrer\./);
});

test('a bootstrap failure renders an alert instead of the form', async () => {
  bffSettings.on('GET', '/settings/bootstrap', { status: 502, body: fixtures.error('Core API indisponible'), outOfContract: true });
  view = mount(React.createElement(Home));

  const html = await view.waitFor((current) => current.includes('role="alert"'));

  assert.match(html, /<p role="alert"[^>]*>Core API indisponible<\/p>/);
  assert.match(html, /<p role="status">Le profil est indisponible\.<\/p>/);
  assert.doesNotMatch(html, /<form/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
});
