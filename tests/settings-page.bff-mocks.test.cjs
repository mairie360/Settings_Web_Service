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
  delete global.window;
  delete process.env.COOKIE_DOMAIN;
  setBrowserFrontUrls({});
  assert.deepEqual([...front.violations, ...bffSettings.violations], []);
});

const upstream = () => bffSettings.requests.map((request) => `${request.method} ${request.template}`);
const profileInputs = () => [...view.html.matchAll(/<input\b[^>]*>/g)].map(([html]) => html);

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
    assert.match(view.html, /role="alert"/);
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
    assert.doesNotMatch(view.html, /role="alert"/);
  });
}

test('an explicit retry recovers an initial upstream refusal through GET only', async () => {
  // Intentional fault injection: 502 is not a published response; it is not contract conformance evidence.
  bffSettings.on('GET', '/settings/bootstrap', { status: 502, body: fixtures.error('Lecture refusée'), outOfContract: true });
  view = mount(React.createElement(Home));
  await view.waitFor(html => html.includes('Le profil est indisponible.'));
  assert.match(view.html, /Lecture refusée/);
  assert.doesNotMatch(view.html, /role="tablist"/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
  bffSettings.on('GET', '/settings/bootstrap', { body: fixtures.bootstrap() });
  await view.click('Réessayer');
  await view.waitFor(html => html.includes('Informations personnelles'));
  assert.doesNotMatch(view.html, /Lecture refusée/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'GET /settings/bootstrap']);
  assert.deepEqual(front.browserCalls, [
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
  ['missing source', fixtures.bootstrap({ sources: {} })],
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
      await view.waitFor(html => html.includes(message));
      assert.match(view.html, /role="alert"/);
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
        await view.click('Sécurité');
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
    await view.click('Sécurité');
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
  await view.click('Sécurité');
  assert.doesNotMatch(view.text(), /Les sessions sont temporairement indisponibles/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'GET /settings/bootstrap']);
  assert.deepEqual(front.browserCalls, [
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
  assert.match(view.html, /<p role="status">Chargement des paramètres…<\/p>/);
  assert.doesNotMatch(view.html, /<form/);

  const html = await view.waitFor((current) => !current.includes('Chargement des paramètres'));

  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
  assert.deepEqual(front.browserCalls, [{ method: 'GET', path: '/settings/bootstrap' }]);
  assert.equal(view.find('AppShell').length, 1);
  assert.match(html, /<aside\b[^]*?<footer\b[^]*?<\/footer>[^]*?<\/aside>/);
  assert.doesNotMatch(html, /<\/main>\s*<footer\b/);
  assert.equal(view.props('AppShell').activeItem, 'settings');
  assert.deepEqual(view.props('AppShell').user, {
    first_name: 'Anne Marie',
    last_name: 'Le Gall',
    email: 'anne.le-gall@mairie.test',
  });
  assert.equal(view.props('AppShell').isAdmin, undefined);
  assert.equal(typeof view.props('AppShell').onLogout, 'function');
  assert.doesNotMatch(html, /aria-label="Notifications"|>Administration</);
  assert.match(html, /<nav role="tablist" aria-label="Paramètres"/);
  assert.match(html, /<button id="settings-tab-profile" type="button" role="tab" aria-selected="true"[^>]*tabindex="0"[^>]*>[^]*?<svg aria-hidden="true"[^]*?Profil<\/button>/);
  assert.match(html, /<div role="tabpanel" id="settings-panel-profile" aria-labelledby="settings-tab-profile"[^>]*>/);
  assert.match(html, /<h2[^>]*>Informations personnelles<\/h2>/);
  assert.match(html, /<input[^>]*type="text"[^>]*required=""[^>]*value="Anne Marie"/);
  assert.match(html, /<input[^>]*type="email"[^>]*value="anne\.le-gall@mairie\.test"/);
  assert.match(html, /<input[^>]*type="tel"[^>]*value="\+33123456789"/);
  assert.match(html, /<button[^>]*type="submit"[^>]*disabled=""[^>]*>Enregistrer<\/button>/);
  assert.match(html, /Aucune modification à enregistrer\./);
  assert.doesNotMatch(html, /role="alert"/);
});

test('the account-menu logout hands off to Login without another BFF call', async () => {
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'https://login.test.example/' });
  const destinations = [];
  global.window = { location: { replace: (href) => destinations.push(href) } };
  await renderLoadedPage();
  await view.act(() => view.props('AppShell').onLogout());

  assert.deepEqual(destinations, ['https://login.test.example/logout']);
  assert.deepEqual(front.browserCalls, [
    { method: 'GET', path: '/settings/bootstrap' },
  ]);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
});

test('the security tab lists the sessions of the bootstrap, or their unavailability', async () => {
  await renderLoadedPage(fixtures.bootstrap({ sessions: [fixtures.session('s-1'), fixtures.session('s-2', { device_info: 'Chrome sur Android', ip_address: '198.51.100.7' })] }));

  await view.click('Sécurité');

  assert.match(view.html, /<button id="settings-tab-security" type="button" role="tab" aria-selected="true"[^>]*tabindex="0"[^>]*>[^]*?<svg aria-hidden="true"[^]*?Sécurité<\/button>/);
  assert.match(view.html, /<h2[^>]*>Sessions<\/h2>/);
  const createdAt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date('2026-09-15T08:00:00Z'));
  assert.ok(view.text().includes(`Firefox sur Linux — 192.0.2.10 Création : ${createdAt}`));
  assert.match(view.html, /<time dateTime="2026-09-15T08:00:00Z">/);
  assert.doesNotMatch(view.text(), /2026-09-15T08:00:00Z/);
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
  assert.match(view.text(), /préférences de notification ne sont pas encore disponibles/);
  assert.doesNotMatch(view.text(), /BFF/);
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

test('system assistance is local and does not fetch unsupported settings', async () => {
  await renderLoadedPage();
  await view.click('Système');
  assert.match(view.text(), /Système et assistance/);
  assert.match(view.text(), /Centre d’aide/);
  assert.match(view.text(), /Aucune donnée n’est transmise/);
  assert.doesNotMatch(view.html, /Vider le cache|v2\.1\.0|10 septembre 2026|50 MB/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
});

test('reference help opens a named dialog and closes without another settings read', async () => {
  await renderLoadedPage(); await view.click('Système'); await view.click('Centre d’aide');
  assert.match(view.html, /<dialog[^>]*aria-labelledby="settings-assistance-title"/);
  assert.match(view.html, /id="settings-assistance-title"[^>]*>Centre d’aide/);
  assert.match(view.text(), /Cette page ne permet pas encore de les révoquer/);
  await view.click('Fermer');
  assert.doesNotMatch(view.html, /Cette page ne permet pas encore de les révoquer/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
});

test('dismissing and reopening a reference request clears its draft, not the profile', async () => {
  await renderLoadedPage(); await view.click('Système'); await view.click('Signaler un problème');
  await view.fire((props) => props.id === 'settings-assistance-message', 'onChange', { target: { value: 'Discarded request' } });
  await view.click('Fermer'); await view.click('Signaler un problème');
  assert.doesNotMatch(view.html, /Discarded request/);
  await view.click('Fermer'); await view.click('Profil');
  assert.match(view.html, /Anne Marie/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
});

for (const [action, name] of [['Préparer une demande de support', 'demande-support-settings.txt'], ['Signaler un problème', 'signalement-settings.txt']]) {
  test(`local assistance exports ${name} without calling the BFF`, async (t) => {
    const exports = [];
    t.mock.method(requireSrc('lib/local-assistance.ts'), 'downloadLocalFile', (file) => exports.push(file));
    await renderLoadedPage(); await view.click('Système'); await view.click(action);
    await view.fire((props) => props.id === 'settings-assistance-message', 'onChange', { target: { value: 'Une question <b>texte</b>' } });
    await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
    assert.equal(exports.length, 1); assert.equal(exports[0].name, name);
    assert.match(exports[0].content, /Une question <b>texte<\/b>/);
    assert.doesNotMatch(exports[0].content, /anne\.le-gall|192\.0\.2|Anne Marie/);
    assert.match(view.text(), /Aucun message n’a été envoyé/);
    assert.doesNotMatch(view.html, /id="settings-assistance-message"/);
    assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
  });
}

test('a failed local export retains its draft, hides raw errors and allows retry', async (t) => {
  let fail = true;
  t.mock.method(requireSrc('lib/local-assistance.ts'), 'downloadLocalFile', () => { if (fail) throw new Error('private detail'); });
  await renderLoadedPage(); await view.click('Système'); await view.click('Signaler un problème');
  await view.fire((props) => props.id === 'settings-assistance-message', 'onChange', { target: { value: 'Mon brouillon' } });
  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  assert.match(view.text(), /Votre message est conservé/); assert.match(view.html, /Mon brouillon/);
  assert.doesNotMatch(view.text(), /private detail|Téléchargement de la demande lancé/);
  fail = false;
  await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
  assert.match(view.text(), /Téléchargement de la demande lancé/); assert.doesNotMatch(view.html, /role="alert"/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
});

test('local assistance rejects blank and oversized text before requesting a download', async (t) => {
  const download = t.mock.method(requireSrc('lib/local-assistance.ts'), 'downloadLocalFile', () => {});
  await renderLoadedPage(); await view.click('Système'); await view.click('Signaler un problème');
  for (const value of [' \n ', 'a'.repeat(5001)]) {
    await view.fire((props) => props.id === 'settings-assistance-message', 'onChange', { target: { value } });
    await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
    assert.match(view.text(), /1 à 5 000 caractères/);
  }
  assert.equal(download.mock.callCount(), 0);
});

test('diagnostic exports use only allowlisted device information and report download errors', async (t) => {
  const exports = [];
  let fail = false;
  t.mock.method(requireSrc('lib/local-assistance.ts'), 'downloadLocalFile', (file) => { if (fail) throw new Error('private detail'); exports.push(file); });
  await renderLoadedPage(); await view.click('Système');
  await view.click('Télécharger le diagnostic local');
  const report = JSON.parse(exports[0].content);
  assert.deepEqual(Object.keys(report).sort(), ['browser', 'capabilities', 'generatedAt', 'module', 'operatingSystem']);
  assert.doesNotMatch(exports[0].content, /anne\.le-gall|192\.0\.2|Anne Marie/);
  assert.match(view.text(), /Aucun fichier n’a été envoyé/);
  fail = true; await view.click('Télécharger le diagnostic local');
  assert.match(view.text(), /diagnostic local n’a pas pu être préparé/);
  assert.doesNotMatch(view.text(), /private detail|Téléchargement du diagnostic local lancé/);
  assert.deepEqual(upstream(), ['GET /settings/bootstrap']);
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
    assert.deepEqual(upstream(), ['GET /settings/bootstrap', 'PATCH /settings/profile']);
    assert.deepEqual(bffSettings.requests[1].body, { first_name: 'Anne' });
    assert.ok(profileInputs().every((html) => !html.includes('disabled=""')));
    assert.match(view.html, /<form[^>]*aria-busy="false"/);
    if (refused) {
      assert.match(view.html, /value="Anne"/);
      assert.match(view.text(), /Service indisponible/);
      assert.doesNotMatch(view.text(), /Votre profil a été enregistré/);
      bffSettings.on('PATCH', '/settings/profile', { body: saved });
      await view.fire((props, text, tag) => tag === 'form', 'onSubmit');
      assert.equal(patchCount, 2);
      assert.deepEqual(bffSettings.requests[2].body, { first_name: 'Anne' });
    }
    assert.match(view.html, /value="ANNE"/);
    assert.match(view.html, /value="LE GALL"/);
    assert.match(view.text(), /Votre profil a été enregistré/);
    await view.fire((props) => props.type === 'text' && props.value === 'ANNE', 'onChange', { target: { value: 'Another draft' } });
    assert.match(view.html, /value="Another draft"/);
    assert.doesNotMatch(view.text(), /Votre profil a été enregistré/);
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
