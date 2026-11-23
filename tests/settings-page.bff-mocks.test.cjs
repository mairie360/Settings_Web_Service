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
const { setBrowserFrontUrls } = requireSrc('lib/front-urls.ts');
const Home = requireSrc('components/SettingsPage/index.ts').default;

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
  // The Security tab reads its second factor and passkeys when it opens (MAIR-807, MAIR-811).
  for (const key of ['GET /settings/2fa', 'GET /settings/passkeys']) bffSettings.on('GET', key.split(' ')[1], fixtures.SETTINGS_OPERATIONS[key].reply);
});
afterEach(() => {
  view?.unmount();
  view = undefined;
  delete global.window;
  delete process.env.COOKIE_DOMAIN;
  setBrowserFrontUrls({});
  assert.deepEqual([...front.violations, ...bffSettings.violations], []);
});

// The lib ToastProvider keeps two empty live regions (status and alert) mounted: page alerts are read without them.
const pageHtml = (html) => html.replace(/<div data-m360-component="ToastProvider"[^>]*><\/div>/g, '');
const stripTags = (fragment) => fragment.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
// MAIR-864: a refused save is a lib danger toast, announced by the provider's assertive region…
const toastAlert = (html) => stripTags(html.match(/data-m360-component="ToastProvider" class="sr-only" role="alert"[^>]*>((?:<div>[^<]*<\/div>)*)<\/div>/)?.[1] ?? '');
// …and the fields to fix carry their message underneath (lib Field: `<p id="<input id>-error" role="alert">`).
const fieldError = (html, field) => stripTags(html.match(new RegExp(`<p id="settings-${field}-error"[^>]*>([^]*?)</p>`))?.[1] ?? '');
// MAIR-807 / MAIR-811: opening Sécurité reads the second factor and the passkeys, nothing else.
const SECURITY_READS = ['GET /settings/2fa', 'GET /settings/passkeys'];
const withoutSecurityReads = () => upstream().filter(call => !SECURITY_READS.includes(call));
const upstream = () => bffSettings.requests.map((request) => `${request.method} ${request.template}`);
const profileInputs = () => [...view.html.matchAll(/<input\b[^>]*>/g)].map(([html]) => html).filter(html => /name="(?:first_name|last_name|email|phone)"/.test(html));

for (const [label, reply] of [
  ['missing object', { body: {} }],
  ['null', { body: null }],
  ['array', { body: [] }],
  ['missing required name', { body: { last_name: 'Reply', email: 'reply@example.invalid' } }],
  ['non-string surname', { body: fixtures.profile({ last_name: 42 }) }],
  ['non-string email', { body: fixtures.profile({ email: false }) }],
  ['non-string optional phone', { body: fixtures.profile({ phone: 42 }) }],
  ['empty JSON body', { raw: '' }],
  ['body-less 204', { status: 204 }],
]) {
  test(`a ${label} save response retains the draft and never confirms a profile`, async () => {
    await renderLoadedPage();
    await view.fire(props => props.type === 'text' && props.value === 'Anne Marie', 'onChange', { target: { value: 'Submitted draft' } });
    // Intentional fault injection, not evidence that this response satisfies the published DTO.
    bffSettings.on('PATCH', '/settings/profile', { ...reply, outOfContract: true });
    await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
    assert.doesNotMatch(view.text(), /Votre profil a été enregistré/);
    assert.match(pageHtml(view.html), /role="alert"/);
    assert.match(view.html, /value="Submitted draft"/);
    assert.match(view.html, /value="Le Gall"/);
    assert.match(view.html, /value="anne\.le-gall@mairie\.test"/);
    assert.equal(view.hostElements(props => props.type === 'submit')[0].props.disabled, false);
    assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'PATCH /settings/profile']);
    assert.deepEqual(bffSettings.requests[1].body, { first_name: 'Submitted draft' });
    bffSettings.on('PATCH', '/settings/profile', { body: fixtures.profile({ first_name: 'OFFICIAL', last_name: 'RECEIVED' }) });
    await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
    assert.deepEqual(bffSettings.requests[2].body, bffSettings.requests[1].body);
    assert.match(view.html, /value="OFFICIAL"/);
    assert.match(view.html, /value="RECEIVED"/);
    assert.match(view.text(), /Votre profil a été enregistré/);
    assert.equal(view.hostElements(props => props.type === 'submit')[0].props.disabled, true);
  });
}

for (const [label, phone] of [['absent', undefined], ['null', null], ['string', '+33987654321']]) {
  test(`a confirmed profile accepts the contract ${label} optional phone`, async () => {
    await renderLoadedPage();
    await view.fire(props => props.type === 'text' && props.value === 'Anne Marie', 'onChange', { target: { value: 'Submitted draft' } });
    const saved = fixtures.profile({ first_name: 'OFFICIAL', phone });
    if (phone === undefined) delete saved.phone;
    bffSettings.on('PATCH', '/settings/profile', { body: saved });
    await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
    assert.match(view.text(), /Votre profil a été enregistré/);
    assert.match(view.html, /value="OFFICIAL"/);
    assert.doesNotMatch(pageHtml(view.html), /role="alert"/);
  });
}

test('an explicit retry recovers an initial upstream refusal through GET only', async () => {
  // Intentional fault injection: 502 is not a published response; it is not contract conformance evidence.
  bffSettings.on('GET', '/settings/bootstrap', { status: 502, body: fixtures.error('Lecture refusée'), outOfContract: true });
  view = mount(React.createElement(Home));
  await view.waitFor(html => html.includes('Profil temporairement indisponible'));
  assert.doesNotMatch(view.html, /Lecture refusée/, 'the upstream reason never reaches the page');
  assert.doesNotMatch(view.html, /role="tablist"/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
  bffSettings.on('GET', '/settings/bootstrap', { body: fixtures.bootstrap() });
  await view.click('Réessayer');
  await view.waitFor(html => html.includes('Informations personnelles'));
  assert.doesNotMatch(view.html, /Lecture refusée/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'GET /settings/bootstrap']);
  assert.deepEqual(front.browserCalls.filter(call => call.path !== '/api/auth/role'), [
    { method: 'GET', path: '/settings/bootstrap' },
    { method: 'GET', path: '/settings/bootstrap' },
  ]);
});

const malformedBootstraps = [
  ['null', null], ['array', []], ['missing sections', {}],
  ['null profile', fixtures.bootstrap({ profile: null })],
  ['missing profile field', fixtures.bootstrap({ profile: { last_name: 'Unverified', email: 'unverified@example.invalid' } })],
  ['invalid phone', fixtures.bootstrap({ profile: fixtures.profile({ phone: 42 }) })],
  ['non-array sessions', fixtures.bootstrap({ sessions: {} })],
  ['null session', fixtures.bootstrap({ sessions: [null] })],
  ['array session', fixtures.bootstrap({ sessions: [[]] })],
  ['null sources', fixtures.bootstrap({ sources: null })],
  ['array sources', fixtures.bootstrap({ sources: [] })],
  ['missing source', fixtures.bootstrap({ sources: { sessions: undefined } })],
  ['unknown source', fixtures.bootstrap({ sources: { sessions: 'partial' } })],
  ...['id', 'device_info', 'ip_address', 'created_at', 'expires_at', 'revoked_at']
    .map(field => [`non-string session ${field}`, fixtures.bootstrap({ sessions: [fixtures.session('s-1', { [field]: 42 })] })]),
];
for (const [name, body] of malformedBootstraps) {
  for (const mode of ['initial', 'refresh']) {
    test(`${mode} rejects a ${name} bootstrap before changing confirmed data and recovers by GET only`, async () => {
      const message = 'Les paramètres reçus sont incohérents. Réessayez.';
      if (mode === 'refresh') {
        await renderLoadedPage(fixtures.bootstrap({ sources: { sessions: 'unavailable' } }));
        await view.fire(props => props.type === 'tel', 'onChange', { target: { value: '+33999999999' } });
      }
      // Deliberately malformed success; never claim it conforms to the published response.
      bffSettings.on('GET', '/settings/bootstrap', { body, outOfContract: true });
      if (mode === 'initial') view = mount(React.createElement(Home));
      else await view.click('Actualiser les paramètres');
      // MAIR-851: before any confirmed profile the page shows « Profil temporairement indisponible », never the reason.
      await view.waitFor(html => html.includes(mode === 'initial' ? 'Profil temporairement indisponible' : message));
      assert.match(pageHtml(view.html), /role="alert"/);
      assert.doesNotMatch(view.text(), /Cannot read|TypeError|Votre profil a été enregistré/);
      assert.equal(bffSettings.requests.length, mode === 'initial' ? 1 : 2, 'no automatic retry');
      assert.equal(bffSettings.requests.filter(request => request.method !== 'GET').length, 0);
      if (mode === 'initial') assert.doesNotMatch(view.html, /role="tablist"/);
      else {
        assert.match(view.html, /value="Anne Marie"/);
        assert.match(view.html, /value="Le Gall"/);
        assert.match(view.html, /value="anne\.le-gall@mairie\.test"/);
        assert.match(view.html, /value="\+33999999999"/);
        assert.doesNotMatch(view.text(), /Unverified/);
        await view.click('Sessions');
        assert.match(view.text(), /Les sessions sont temporairement indisponibles/);
        assert.doesNotMatch(view.text(), /Aucune session à afficher/);
        await view.click('Profil');
      }
      bffSettings.on('GET', '/settings/bootstrap', { body: fixtures.bootstrap({ profile: fixtures.profile({ last_name: 'Confirmed surname' }) }) });
      await view.click(mode === 'initial' ? 'Réessayer' : 'Actualiser les paramètres');
      await view.waitFor(html => html.includes('Confirmed surname'));
      assert.doesNotMatch(view.text(), /paramètres reçus sont incohérents/);
      assert.equal(bffSettings.requests.length, mode === 'initial' ? 2 : 3);
      assert.equal(bffSettings.requests.filter(request => request.method !== 'GET').length, 0);
      if (mode === 'refresh') {
        assert.match(view.html, /value="\+33999999999"/);
        bffSettings.on('PATCH', '/settings/profile', { body: fixtures.profile({ last_name: 'Confirmed surname', phone: '+33999999999' }) });
        await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
        assert.deepEqual(bffSettings.requests.at(-1).body, { phone: '+33999999999' });
        assert.equal(bffSettings.requests.filter(request => request.method !== 'GET').length, 1);
      }
    });
  }
}

for (const phone of [undefined, null, '+33123456789']) {
  test(`bootstrap keeps contract-valid optional phone ${String(phone)} and dates with an explicit display fallback`, async () => {
    const profile = fixtures.profile({ phone });
    if (phone === undefined) delete profile.phone;
    const session = fixtures.session('s-1', { created_at: 'not-a-date', expires_at: '2026-02-30T08:00:00Z', revoked_at: undefined });
    delete session.revoked_at;
    await renderLoadedPage(fixtures.bootstrap({ profile, sessions: [session] }));
    await view.click('Sessions');
    assert.match(view.text(), /Date indisponible/);
    assert.doesNotMatch(view.text(), /paramètres reçus sont incohérents/);
    assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
  });
}

test('refreshing unavailable sessions keeps dirty fields and updates clean fields without a PATCH', async () => {
  await renderLoadedPage(fixtures.bootstrap({ sessions: [], sources: { sessions: 'unavailable' } }));
  await view.fire((props, text, tag) => tag === 'input' && props.type === 'text' && props.value === 'Anne Marie', 'onChange', { target: { value: 'Draft' } });
  const received = fixtures.bootstrap();
  received.profile.last_name = 'Received surname';
  bffSettings.on('GET', '/settings/bootstrap', { body: received });
  await view.click('Actualiser les paramètres');
  await view.waitFor(html => html.includes('Received surname'));
  assert.match(view.html, /value="Draft"/);
  assert.match(view.html, /value="Received surname"/);
  assert.doesNotMatch(view.html, /Votre profil a été enregistré/);
  await view.click('Sessions');
  assert.doesNotMatch(view.text(), /Les sessions sont temporairement indisponibles/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'GET /settings/bootstrap']);
  assert.deepEqual(front.browserCalls.filter(call => call.path !== '/api/auth/role'), [
    { method: 'GET', path: '/settings/bootstrap' },
    { method: 'GET', path: '/settings/bootstrap' },
  ]);
});

async function renderLoadedPage(body = fixtures.bootstrap()) {
  bffSettings.on('GET', '/settings/bootstrap', { body });
  view = mount(React.createElement(Home));
  return view.waitFor((html) => !html.includes('Chargement des paramètres'));
}

test('an unusable profile reply does not poison a recovered read or repeat its PATCH', async () => {
  await renderLoadedPage(fixtures.bootstrap({ sessions: [], sources: { sessions: 'unavailable' } }));
  await view.fire(props => props.type === 'text' && props.value === 'Anne Marie', 'onChange', { target: { value: 'Retained draft' } });
  // Deliberately malformed confirmation, not a conforming deployed BFF response.
  bffSettings.on('PATCH', '/settings/profile', { body: {}, outOfContract: true });
  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  assert.match(view.text(), /L’enregistrement du profil n’a pas été confirmé/);
  const received = fixtures.bootstrap({ sessions: [], sources: { sessions: 'unavailable' } });
  received.profile.first_name = 'Read name';
  received.profile.last_name = 'Read surname';
  bffSettings.on('GET', '/settings/bootstrap', { body: received });
  await view.click('Actualiser les paramètres');
  await view.waitFor(html => html.includes('Read surname'));
  assert.match(view.html, /value="Retained draft"/);
  assert.match(view.html, /value="Read surname"/);
  assert.match(view.text(), /L’enregistrement du profil n’a pas été confirmé/);
  assert.doesNotMatch(view.text(), /Votre profil a été enregistré/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'PATCH /settings/profile', 'GET /settings/bootstrap']);

  const official = fixtures.profile({ first_name: 'Confirmed name', last_name: 'Confirmed surname' });
  bffSettings.on('PATCH', '/settings/profile', { body: official });
  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  assert.deepEqual(bffSettings.requests[3].body, { first_name: 'Retained draft' });
  assert.match(view.text(), /Votre profil a été enregistré/);
  assert.match(view.html, /value="Confirmed name"/);
  assert.doesNotMatch(view.text(), /L’enregistrement du profil n’a pas été confirmé/);

  await view.fire(props => props.type === 'text' && props.value === 'Confirmed name', 'onChange', { target: { value: 'Next draft' } });
  const next = fixtures.bootstrap({ profile: { ...official, last_name: 'Read after confirmation' } });
  bffSettings.on('GET', '/settings/bootstrap', { body: next });
  await view.click('Actualiser les paramètres');
  await view.waitFor(html => html.includes('Read after confirmation'));
  assert.match(view.html, /value="Next draft"/);
  assert.match(view.html, /value="Read after confirmation"/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'PATCH /settings/profile', 'GET /settings/bootstrap', 'PATCH /settings/profile', 'GET /settings/bootstrap']);
});

test('the first pass renders the loading state, the next one the profile form filled from GET /settings/bootstrap', async () => {
  bffSettings.on('GET', '/settings/bootstrap', { body: fixtures.bootstrap() });
  view = mount(React.createElement(Home));

  assert.equal(view.passes, 1);
  assert.match(view.html, /<h1[^>]*>Paramètres<\/h1>/);
  // MAIR-851 (O1): the lib Panel in its loading state, titled « Chargement des paramètres… ».
  assert.match(view.html, /data-m360-component="Panel"[^>]*data-state="loading"[^]*Chargement des paramètres…<\/h2>/);
  assert.doesNotMatch(view.html, /<form/);

  const html = await view.waitFor((current) => !current.includes('Chargement des paramètres'));

  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
  assert.deepEqual(front.browserCalls.filter(call => call.path !== '/api/auth/role'), [{ method: 'GET', path: '/settings/bootstrap' }]);
  assert.equal(view.find('AppShell').length, 1);
  assert.doesNotMatch(html, /<aside\b[^]*?<footer\b[^]*?<\/footer>[^]*?<\/aside>/);
  // MAIR-1125 / lib-components 2.3: the V2 Settings page has no footer.
  assert.doesNotMatch(html, /<footer\b/);
  assert.equal(view.props('AppShell').activeItem, 'settings');
  assert.deepEqual(view.props('AppShell').user, {
    first_name: 'Anne Marie',
    last_name: 'Le Gall',
    email: 'anne.le-gall@mairie.test',
  });
  assert.equal(view.props('AppShell').isAdmin, false);
  assert.equal(typeof view.props('AppShell').onLogout, 'function');
  assert.doesNotMatch(html, />Administration</);
  assert.match(html, /aria-label="Notifications"/);
  assert.match(html, /<div role="tablist" aria-label="Paramètres"/);
  assert.match(html, /<button id="settings-tab-profile" role="tab" type="button" aria-selected="true"[^>]*tabindex="0"[^>]*>[^]*?<svg[^>]*aria-hidden="true"[^]*?Profil<\/button>/);
  assert.match(html, /<div role="tabpanel" id="settings-panel-profile" aria-labelledby="settings-tab-profile"[^>]*>/);
  assert.match(html, /<h2[^>]*>Informations personnelles<\/h2>/);
  assert.match(html, /<input[^>]*type="text"[^>]*required=""[^>]*value="Anne Marie"/);
  assert.match(html, /<input[^>]*type="email"[^>]*value="anne\.le-gall@mairie\.test"/);
  assert.match(html, /<input[^>]*type="tel"[^>]*value="\+33123456789"/);
  assert.match(html, /<button[^>]*type="submit"[^>]*disabled=""[^>]*>(?:<svg[^]*?<\/svg>)?Enregistrer<\/button>/);
  assert.match(html, /Aucune modification à enregistrer\./);
  assert.doesNotMatch(pageHtml(html), /role="alert"/);
});

test('unconfirmed account-menu logout retains the draft until explicit canonical Login return', async () => {
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'https://login.test.example/', SETTINGS_FRONT_URL: front.ORIGIN });
  const destinations = [];
  global.window = { location: { origin: front.ORIGIN, pathname: '/', search: '?tab=profile', href: front.ORIGIN + '/?tab=profile', assign: href => destinations.push(href) } };
  await renderLoadedPage();
  const field = view.hostElements((props, _text, tag) => tag === 'input' && props.type === 'text')[0];
  await view.act(() => field.props.onChange({ target: { value: 'Brouillon conservé' } }));
  await view.act(() => view.props('AppShell').onLogout());
  await view.waitFor(() => view.text().includes('Retour à la connexion'));
  assert.deepEqual(destinations, []);
  assert.match(view.text(), /déconnexion n’a pas été confirmée/);
  assert.match(view.html, /value="Brouillon conservé"/);
  assert.deepEqual(front.browserCalls.map(call => call.method + ' ' + call.path), ['GET /settings/bootstrap', 'POST /api/auth/logout']);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
  await view.click('Retour à la connexion');
  assert.equal(destinations.length, 1);
  assert.equal(new URL(destinations[0]).searchParams.get('redirect'), front.ORIGIN + '/?tab=profile');
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
});

test('MAIR-851: the sessions tab lists the sessions of the bootstrap, or their unavailability', async () => {
  await renderLoadedPage(fixtures.bootstrap({ sessions: [fixtures.session('s-1'), fixtures.session('s-2', { device_info: 'Chrome sur Android', ip_address: '198.51.100.7' })] }));

  await view.click('Sessions');

  assert.match(view.html, /<button id="settings-tab-sessions" role="tab" type="button" aria-selected="true"[^>]*tabindex="0"[^>]*>[^]*?<svg[^>]*aria-hidden="true"[^]*?Sessions<\/button>/);
  // MAIR-892: the active sessions, « Cet appareil » for the session of the page, then the history.
  assert.match(view.html, /<h2[^>]*>Sessions actives<\/h2>/);
  assert.match(view.html, /<h2[^>]*>Historique des connexions<\/h2>/);
  assert.match(view.text(), /Cet appareil/);
  assert.match(view.text(), /Chrome sur Windows/, 'the ended session of the history');
  const createdAt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })
    .format(new Date('2026-09-15T08:00:00Z'));
  // MAIR-607: the shared SessionList renders one row per session (device, IP, creation, expiry, state).
  assert.match(view.html, /<th[^>]*>Appareil<\/th><th[^>]*>Adresse IP<\/th>/);
  assert.match(view.text(), /Firefox sur Linux/); assert.match(view.text(), /192\.0\.2\.10/); assert.ok(view.text().includes(createdAt));
  assert.match(view.html, /<time dateTime="2026-09-15T08:00:00Z">/);
  assert.doesNotMatch(view.text(), /2026-09-15T08:00:00Z/);
  assert.match(view.text(), /Chrome sur Android/); assert.match(view.text(), /198\.51\.100\.7/);
  assert.doesNotMatch(view.text(), /Mot de passe actuel/, 'the sessions left the security tab');
  assert.deepEqual(upstream(), ['GET /settings/bootstrap'], 'changing tab does not call the BFF');

  view.unmount();
  await renderLoadedPage(fixtures.bootstrap({ sessions: [], sources: { sessions: 'unavailable' } }));
  await view.click('Sessions');
  assert.match(view.text(), /Les sessions sont temporairement indisponibles\./);

  await view.click('Notifications');
  assert.match(view.html, /<h2[^>]*>Préférences de notification<\/h2>/);
  // MAIR-902: one switch per notification, each saved at once (no form, no « Enregistrer »).
  assert.match(view.text(), /Les changements s’appliquent immédiatement\./);
  const preferencesDom = new (require('jsdom').JSDOM)(view.html);
  try { assert.equal(preferencesDom.window.document.querySelectorAll('[role="switch"]').length, 6); }
  finally { preferencesDom.window.close(); }
  assert.doesNotMatch(view.text(), /Enregistrer les préférences/);
  assert.doesNotMatch(view.text(), /BFF/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'GET /settings/bootstrap'], 'an unavailable tab does not call the BFF');
});

test('arrow, Home and End keys select and focus Settings tabs without a call beyond the reads of the tab', async () => {
  await renderLoadedPage();
  const focused = [];
  // MAIR-608: the lib Tabs focus the next tab by id (settings-tab-<key>); the runner has no DOM, so the ids resolve here.
  const ids = ['profile', 'security', 'sessions', 'notifications', 'appearance', 'general'];
  const previousGetElementById = global.document?.getElementById;
  global.document.getElementById = (id) => { const index = ids.indexOf(String(id).replace('settings-tab-', '')); return index === -1 ? null : { focus() { focused.push(index); } }; };
  try {
  const key = async (label, pressed) => view.fire(
    (props, text) => props.role === 'tab' && text === label,
    'onKeyDown',
    { key: pressed, preventDefault() {} },
  );

  await key('Profil', 'ArrowRight');
  assert.match(view.html, /id="settings-panel-security"/);
  assert.deepEqual(focused, [1]);
  await key('Sécurité', 'End');
  assert.match(view.html, /id="settings-panel-general"/);
  assert.deepEqual(focused, [1, 5]);
  await key('Général', 'ArrowRight');
  assert.match(view.html, /id="settings-panel-profile"/);
  assert.deepEqual(focused, [1, 5, 0]);
  await key('Profil', 'Home');
  assert.deepEqual(focused, [1, 5, 0, 0]);
  assert.deepEqual(withoutSecurityReads(), ['GET /settings/bootstrap']);
  } finally { global.document.getElementById = previousGetElementById; }
});

for (const refused of [false, true]) {
  test(`a pending profile save is synchronous, freezes edits across tabs and ${refused ? 'retains a refused draft for retry' : 'uses the confirmed result'}`, async (t) => {
    await renderLoadedPage();
    await view.fire((props) => props.type === 'text' && props.value === 'Anne Marie', 'onChange', { target: { value: 'Anne' } });
    const saved = fixtures.profile({ first_name: 'ANNE', last_name: 'LE GALL' });
    bffSettings.on('PATCH', '/settings/profile', refused
      ? { status: 503, body: { error: { message: 'Service indisponible' } }, outOfContract: true }
      : { body: saved });

    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const handle = bffSettings.handle;
    let patchCount = 0;
    t.mock.method(bffSettings, 'handle', async function (request, response) {
      if (request.method === 'PATCH') { patchCount += 1; await gate; }
      return handle.call(this, request, response);
    });
    const submit = view.hostElements((props, text, tag) => tag === 'form')[0].props.onSubmit;
    const staleChange = view.hostElements((props) => props.type === 'text' && props.value === 'Anne')[0].props.onChange;
    const pending = submit({ preventDefault() {} });
    // No render or await between these calls: state alone cannot guard this race.
    const duplicate = submit({ preventDefault() {} });
    staleChange({ target: { value: 'An edit during the request' } });
    try {
      await view.waitFor((html) => html.includes('Enregistrement…'));
      assert.equal(profileInputs().length, 4);
      assert.ok(profileInputs().every((html) => html.includes('disabled=""')));
      assert.match(view.html, /<form[^>]*aria-busy="true"/);
      assert.doesNotMatch(view.html, /Votre profil a été enregistré|An edit during the request/);
      await view.click('Sécurité'); await view.click('Profil');
      assert.ok(profileInputs().every((html) => html.includes('disabled=""')));
      await view.waitFor(() => patchCount === 1);
    } finally {
      release(); await Promise.all([pending, duplicate]); await view.settle();
    }
    assert.equal(patchCount, 1);
    assert.deepEqual(withoutSecurityReads(), ['GET /settings/bootstrap', 'PATCH /settings/profile']);
    const patches = () => bffSettings.requests.filter(request => request.method === 'PATCH');
    assert.deepEqual(patches()[0].body, { first_name: 'Anne' });
    assert.ok(profileInputs().every((html) => !html.includes('disabled=""')));
    assert.match(view.html, /<form[^>]*aria-busy="false"/);
    if (refused) {
      assert.match(view.html, /value="Anne"/);
      assert.match(view.text(), /Service indisponible/);
      assert.doesNotMatch(view.text(), /Votre profil a été enregistré/);
      bffSettings.on('PATCH', '/settings/profile', { body: saved });
      await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
      assert.equal(patchCount, 2);
      assert.deepEqual(patches()[1].body, { first_name: 'Anne' });
    }
    assert.match(view.html, /value="ANNE"/);
    assert.match(view.html, /value="LE GALL"/);
    assert.match(view.text(), /Votre profil a été enregistré/);
    await view.fire((props) => props.type === 'text' && props.value === 'ANNE', 'onChange', { target: { value: 'Another draft' } });
    assert.match(view.html, /value="Another draft"/);
    assert.equal(view.hostElements((props) => props.type === 'submit')[0].props.disabled, false);
  });
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
  const html = await view.waitFor((current) => current.includes('Votre profil a été enregistré.'));

  assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'PATCH /settings/profile']);
  assert.deepEqual(bffSettings.requests[1].body, { first_name: 'Anne' });
  const receiptDom = new (require('jsdom').JSDOM)(html);
  try {
    const announcements = [...receiptDom.window.document.querySelectorAll('[role="status"]')]
      .filter(node => node.textContent.includes('Votre profil a été enregistré.'));
    assert.equal(announcements.length, 1, 'the confirmed profile receipt has one live announcement');
  } finally { receiptDom.window.close(); }
  assert.match(html, /<input[^>]*type="text"[^>]*value="LE GALL"/);
  assert.match(html, /<button[^>]*type="submit"[^>]*disabled=""[^>]*>(?:<svg[^]*?<\/svg>)?Enregistrer<\/button>/, 'the button is disabled again');
  assert.match(html, /Aucune modification à enregistrer\./);
});

test('a refused save keeps the form and shows the BFF message', async () => {
  await renderLoadedPage();
  bffSettings.on('PATCH', '/settings/profile', { status: 400, body: fixtures.error('Numéro de téléphone invalide', 400), outOfContract: true });

  // "12" passes the contract pattern of SettingsProfilePatch.phone (digits, spaces, dots, dashes, optional +):
  // the refusal comes from the BFF's own validation, not from the mock's contract check.
  await view.fire((props) => props.type === 'tel', 'onChange', { target: { value: '061234567' } });
  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  const html = await view.waitFor((current) => toastAlert(current) !== '');

  // MAIR-864 (P1): a refusal without field details is the « Enregistrement impossible » toast, the draft is kept.
  assert.equal(toastAlert(html), 'Enregistrement impossible Numéro de téléphone invalide');
  assert.match(html, /value="Anne Marie"/);
  assert.match(html, /<p role="status"[^>]*><\/p>/, 'the empty success live region stays mounted after refusal');
  assert.deepEqual(bffSettings.requests[1].body, { phone: '061234567' });
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

  const html = await view.waitFor((current) => pageHtml(current).includes('role="alert"'));

  // MAIR-851 (O1): a warning with « Réessayer », the upstream reason stays out of the page.
  assert.match(html, /Profil temporairement indisponible/);
  assert.doesNotMatch(html, /Core API indisponible/);
  assert.match(view.text(), /Réessayer/);
  assert.doesNotMatch(html, /<form/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
});

// MAIR-511: the BFF only changes the e-mail with the current password, and refuses fields outside the
// contract constraints with `error.details[]`.
const PROFILE_PATCH_SCHEMA = OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json')).schema('SettingsProfilePatch');
const { PROFILE_FIELDS, CURRENT_PASSWORD, describeDetail } = requireSrc('lib/profile-form.ts');
const passwordInputs = () => [...view.html.matchAll(/<input\b[^>]*>/g)].map(([html]) => html).filter(html => /name="current_password"/.test(html));
const isEmailInput = (props) => props.type === 'email';
const htmlPattern = (pattern) => new RegExp(`^(?:${pattern})$`, 'v');

test('the input constraints mirror the SettingsProfilePatch schema of the published contract', () => {
  assert.deepEqual(PROFILE_FIELDS.map(({ field }) => field), ['first_name', 'last_name', 'email', 'phone']);
  for (const { field, maxLength, pattern, required } of PROFILE_FIELDS) {
    const schema = PROFILE_PATCH_SCHEMA.properties[field];
    assert.equal(maxLength, schema.maxLength, field);
    assert.equal(required, (schema.minLength ?? 0) > 0 || !Array.isArray(schema.type), `${field} required`);
    if (schema.pattern) {
      // The HTML pattern (anchored, `v` flag) accepts exactly what the contract's regex accepts.
      const contract = new RegExp(schema.pattern);
      const browser = htmlPattern(pattern);
      for (const sample of ['', 'Anne Marie', 'Le Gall-Martin', '<b>x</b>', 'a>b', '+33 1 23 45 67 89', '06.12.34.56.78', '(01) 23-45', '12+3', '+', 'abc', ' 0612']) {
        assert.equal(browser.test(sample), contract.test(sample), `${field} ${JSON.stringify(sample)}`);
      }
    } else {
      assert.equal(pattern, undefined, field);
    }
  }
  assert.equal(CURRENT_PASSWORD.maxLength, PROFILE_PATCH_SCHEMA.properties.current_password.maxLength);
});

test('the rendered inputs carry the contract constraints and their help text', async () => {
  const html = await renderLoadedPage();
  // react-dom/server writes `maxLength` as such and escapes `<` / `>` in attribute values.
  assert.match(html, /<input(?=[^>]*maxLength="64")(?=[^>]*pattern="\[\^&lt;&gt;\]\*")(?=[^>]*aria-describedby="settings-first_name-hint")[^>]*name="first_name"/);
  assert.match(html, /<input(?=[^>]*maxLength="64")(?=[^>]*pattern="\[\^&lt;&gt;\]\*")[^>]*name="last_name"/);
  assert.match(html, /<input(?=[^>]*type="email")(?=[^>]*maxLength="320")[^>]*name="email"/);
  assert.doesNotMatch(html, /<input[^>]*type="email"[^>]*pattern=/);
  assert.match(html, /<input(?=[^>]*type="tel")(?=[^>]*maxLength="32")(?=[^>]*pattern="\(\\\+\?\[\\d\\s\.\\\(\\\)\\-\]\+\)\?")[^>]*aria-describedby="settings-phone-hint"[^>]*name="phone"/);
  assert.match(html, /<p id="settings-phone-hint"[^>]*>Visible par tous les agents de la mairie \(usage professionnel\)\. Chiffres, espaces, points, tirets et parenthèses, avec un \+ initial facultatif \(32 caractères maximum\)\.<\/p>/);
  assert.match(html, /<p id="settings-first_name-hint"[^>]*>64 caractères maximum, sans &lt; ni &gt;\.<\/p>/);
  assert.equal(passwordInputs().length, 0);
});

test('a changed e-mail shows the current-password field, which disappears once the address is restored or only recased', async () => {
  await renderLoadedPage();
  await view.fire(isEmailInput, 'onChange', { target: { value: 'anne.nouvelle@mairie.test' } });
  assert.equal(passwordInputs().length, 1);
  assert.match(passwordInputs()[0], /<input(?=[^>]*type="password")(?=[^>]*autoComplete="current-password")(?=[^>]*required="")(?=[^>]*maxLength="255")(?=[^>]*aria-describedby="settings-current_password-hint")[^>]*name="current_password"/);
  assert.match(view.html, /<p id="settings-current_password-hint"[^>]*>Requis pour confirmer le changement d’adresse e-mail\. Il n’est pas conservé\.<\/p>/);
  assert.match(view.html, /type="email"[^]*?type="password"[^]*?type="tel"/, 'the password field follows the e-mail field');

  await view.fire((props) => props.type === 'password', 'onChange', { target: { value: 'secret' } });
  assert.match(passwordInputs()[0], /value="secret"/);

  // The BFF compares trimmed, case-insensitive addresses: a recased address is not a change.
  await view.fire(isEmailInput, 'onChange', { target: { value: ' Anne.Le-Gall@Mairie.test ' } });
  assert.equal(passwordInputs().length, 0);
  await view.fire(isEmailInput, 'onChange', { target: { value: 'anne.nouvelle@mairie.test' } });
  assert.equal(passwordInputs().length, 1);
  assert.match(passwordInputs()[0], /value=""/, 'the typed password is dropped when the field disappears');
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
});

test('an e-mail change without the current password is refused locally, then sent with it and the password is dropped', async () => {
  await renderLoadedPage();
  await view.fire(isEmailInput, 'onChange', { target: { value: 'anne.nouvelle@mairie.test' } });
  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  assert.equal(fieldError(view.html, 'current_password'), 'Saisissez votre mot de passe actuel pour changer votre adresse e-mail.');
  assert.equal(toastAlert(view.html), 'Profil non enregistré Corrigez les champs signalés.');
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
  assert.match(passwordInputs()[0], /required=""/);

  await view.fire((props) => props.type === 'password', 'onChange', { target: { value: 'current-secret' } });
  assert.equal(fieldError(view.html, 'current_password'), '', 'the error disappears as the agent types');
  const saved = fixtures.profile({ email: 'anne.nouvelle@mairie.test' });
  bffSettings.on('PATCH', '/settings/profile', { body: saved });
  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  await view.waitFor((html) => html.includes('Votre profil a été enregistré.'));

  assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'PATCH /settings/profile']);
  assert.deepEqual(bffSettings.requests[1].body, { email: 'anne.nouvelle@mairie.test', current_password: 'current-secret' });
  assert.equal(passwordInputs().length, 0, 'the saved address is the confirmed one');
  assert.doesNotMatch(view.html, /current-secret/);
  assert.match(view.html, /<input[^>]*type="email"[^>]*value="anne\.nouvelle@mairie\.test"/);

  // A later e-mail change asks for the password again, from an empty field.
  await view.fire(isEmailInput, 'onChange', { target: { value: 'anne.autre@mairie.test' } });
  assert.match(passwordInputs()[0], /value=""/);
});

test('a save without an e-mail change never sends current_password', async () => {
  await renderLoadedPage();
  await view.fire((props) => props.type === 'text' && props.value === 'Anne Marie', 'onChange', { target: { value: 'Anne' } });
  bffSettings.on('PATCH', '/settings/profile', { body: fixtures.profile({ first_name: 'Anne' }) });
  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  await view.waitFor((html) => html.includes('Votre profil a été enregistré.'));
  assert.deepEqual(bffSettings.requests[1].body, { first_name: 'Anne' });
  assert.equal(passwordInputs().length, 0);
});

for (const [label, reply, expected] of [
  ['400 with validation details', {
    status: 400,
    body: { error: { code: 'BAD_REQUEST', message: 'Validation failed', details: [
      { path: 'body.current_password', message: 'Required when email is changed' },
      { path: 'body.first_name', message: 'Must not contain < or >' },
      { path: 'body.phone', message: 'Expected a phone number: digits, spaces, `.`, `-`, `(`, `)` and a leading `+`' },
      { path: 'body.phone_country', message: 'Expected an ISO 3166-1 alpha-2 code' },
      { path: 'body.last_name', message: 'String must contain at most 64 character(s)' },
      { path: 'body.email', message: 'Invalid email' },
      { path: 'body', message: 'Unrecognized key(s) in object: \'nickname\'' },
      { message: 'Something unexpected' },
    ] } },
  }, {
    // MAIR-864 (P2): each field the BFF refuses gets its message underneath, the toast asks to fix them.
    toast: 'Profil non enregistré Corrigez les champs signalés.',
    fields: {
      current_password: 'Requis pour changer l’adresse e-mail.',
      first_name: 'Ne doit pas contenir < ni >.',
      phone: 'Chiffres, espaces, points, tirets, parenthèses et un + initial seulement.',
      last_name: '64 caractères maximum.',
      email: 'Adresse e-mail invalide.',
    },
  }],
  ['400 without details', { status: 400, body: fixtures.error('Validation failed', 400) }, { toast: 'Enregistrement impossible Validation failed', fields: {} }],
  ['403 wrong password', { status: 403, body: fixtures.error('Invalid credentials', 403) }, { toast: 'Profil non enregistré Corrigez les champs signalés.', fields: { current_password: 'Le mot de passe actuel est incorrect, ou ce compte n’a pas de mot de passe.' } }],
  ['409 address in use', { status: 409, body: fixtures.error('Email already used', 409) }, { toast: 'Profil non enregistré Corrigez les champs signalés.', fields: { email: 'Cette adresse e-mail est déjà utilisée par un autre compte.' } }],
  ['503 upstream', { status: 503, body: fixtures.error('Core API indisponible', 503) }, { toast: 'Enregistrement impossible Core API indisponible', fields: {} }],
]) {
  test(`a refused e-mail change (${label}) is explained in French and keeps the draft and the password field`, async () => {
    await renderLoadedPage();
    await view.fire(isEmailInput, 'onChange', { target: { value: 'anne.nouvelle@mairie.test' } });
    await view.fire((props) => props.type === 'password', 'onChange', { target: { value: 'current-secret' } });
    bffSettings.on('PATCH', '/settings/profile', { ...reply, outOfContract: true });
    await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
    const html = await view.waitFor((current) => toastAlert(current) !== '');

    assert.equal(toastAlert(html), expected.toast);
    for (const field of ['first_name', 'last_name', 'email', 'phone', 'current_password']) {
      assert.equal(fieldError(html, field), expected.fields[field] ?? '', field);
    }
    assert.deepEqual(bffSettings.requests[1].body, { email: 'anne.nouvelle@mairie.test', current_password: 'current-secret' });
    assert.match(html, /<input[^>]*type="email"[^>]*value="anne\.nouvelle@mairie\.test"/);
    assert.equal(passwordInputs().length, 1);
    assert.match(passwordInputs()[0], /value="current-secret"/, 'the password stays for a retry');
    assert.doesNotMatch(html, /Votre profil a été enregistré/);
  });
}

test('a 403 on a save without password keeps the BFF message', async () => {
  await renderLoadedPage();
  await view.fire((props) => props.type === 'text' && props.value === 'Anne Marie', 'onChange', { target: { value: 'Anne' } });
  bffSettings.on('PATCH', '/settings/profile', { status: 403, body: fixtures.error('Accès refusé', 403), outOfContract: true });
  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  const html = await view.waitFor((current) => toastAlert(current) !== '');
  assert.equal(toastAlert(html), 'Enregistrement impossible Accès refusé');
});

test('MAIR-864 (P2): invalid fields are refused locally, under each field, with the toast and no request', async () => {
  await renderLoadedPage();
  await view.fire((props) => props.type === 'text' && props.value === 'Anne Marie', 'onChange', { target: { value: '  ' } });
  await view.fire((props) => props.type === 'tel', 'onChange', { target: { value: '12' } });
  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  assert.equal(fieldError(view.html, 'first_name'), 'Le prénom est obligatoire.');
  assert.equal(fieldError(view.html, 'phone'), 'Saisissez un numéro au format 06 12 34 56 78.');
  assert.match(view.html, /<input[^>]*aria-invalid="true"[^>]*aria-describedby="settings-first_name-error[^"]*"/);
  assert.equal(toastAlert(view.html), 'Profil non enregistré Corrigez les champs signalés.');
  assert.deepEqual(upstream(), ['GET /settings/bootstrap'], 'nothing is sent');
  await view.fire((props) => props.name === 'first_name', 'onChange', { target: { value: 'Anne' } });
  assert.equal(fieldError(view.html, 'first_name'), '', 'the error disappears as the agent types');
  assert.equal(fieldError(view.html, 'phone'), 'Saisissez un numéro au format 06 12 34 56 78.');
});

test('MAIR-864: « Annuler » restores the confirmed values and the counter follows the draft', async () => {
  await renderLoadedPage();
  assert.match(view.text(), /Aucune modification à enregistrer\./);
  await view.fire((props) => props.type === 'text' && props.value === 'Anne Marie', 'onChange', { target: { value: 'Anne' } });
  await view.fire((props) => props.type === 'tel', 'onChange', { target: { value: '0611223344' } });
  assert.match(view.text(), /2 champs modifiés\./);
  await view.click('Annuler');
  assert.match(view.html, /value="Anne Marie"/);
  assert.match(view.html, /value="\+33123456789"/);
  assert.match(view.text(), /Aucune modification à enregistrer\./);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
});

test('describeDetail labels known fields and keeps unknown paths and messages', () => {
  assert.equal(describeDetail({ path: 'body.current_password', message: 'Required when email is changed' }), 'Mot de passe actuel : requis pour changer l’adresse e-mail');
  assert.equal(describeDetail({ path: 'current_password', message: 'Required' }), 'Mot de passe actuel : requis');
  assert.equal(describeDetail({ path: 'body.nickname', message: 'Unknown' }), 'nickname : Unknown');
  assert.equal(describeDetail({ path: 'body.first_name', message: 'String must contain at least 1 character(s)' }), 'Prénom : ne doit pas être vide');
  assert.equal(describeDetail({ path: 'body.first_name', message: 'String must contain at least 2 character(s)' }), 'Prénom : 2 caractères minimum');
  assert.equal(describeDetail({ path: 'body.first_name', message: 'Too big: expected string to have <=64 characters' }), 'Prénom : 64 caractères maximum');
  assert.equal(describeDetail({ message: 'Expected at least one of first_name, last_name, email, phone, phone_country' }), 'Expected at least one of first_name, last_name, email, phone, phone_country');
});

test('MAIR-807 / MAIR-811: the Security tab reads the second factor and the passkeys through the contract proxy', async () => {
  await renderLoadedPage();
  await view.click('Sécurité');
  await view.waitFor(html => html.includes('Codes de secours restants') && html.includes('Ordinateur de la mairie'));
  assert.match(view.text(), /Double authentification/);
  assert.match(view.text(), /Activée/);
  assert.match(view.text(), /Codes de secours restants : 8 sur 10/);
  assert.match(view.text(), /Passkeys/);
  assert.match(view.text(), /Google Password Manager/);
  assert.deepEqual(upstream().sort(), ['GET /settings/2fa', 'GET /settings/bootstrap', 'GET /settings/passkeys']);
});

test('MAIR-807: an unavailable second factor offers « Réessayer » without breaking the tab', async () => {
  bffSettings.on('GET', '/settings/2fa', { status: 502, body: fixtures.error('Core API indisponible', 502), outOfContract: true });
  await renderLoadedPage();
  await view.click('Sécurité');
  await view.waitFor(html => html.includes('Double authentification indisponible'));
  assert.doesNotMatch(view.text(), /Core API indisponible/);
  assert.match(view.text(), /Mot de passe actuel/);
});
