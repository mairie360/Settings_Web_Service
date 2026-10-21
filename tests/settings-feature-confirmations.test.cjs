const assert = require('node:assert/strict');
const { test } = require('node:test');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
installReactRuntime();
const React = require('react');
const { requireSrc } = require('./support/load-ts.cjs');
const Features = requireSrc('components/settings-pending-features.tsx').default;
const Revoke = requireSrc('components/settings-session-revoke.tsx').default;

function panel(t, tab, port = {}, extra = {}) {
  const view = mount(React.createElement(Features, { tab, port, isAdmin: true, ...extra }));
  t.after(() => view.unmount());
  return view;
}
// MAIR-608: the lib fields are composed components, so controls resolve by their `name`, never by render order.
const control = (view, tag, name) => view.hostElements((props, text, type) => type === tag && props.name === name && typeof props.onChange === 'function')[0];
async function change(view, tag, name, value, more = {}) {
  const host = control(view, tag, name);
  assert.ok(host, `${tag} ${name} exists`);
  await view.act(() => host.props.onChange({ target: { value, ...more } }));
}
// MAIR-608: the submit buttons are lib presets (no static text on the form), so each form carries a stable data-form name.
const formNames = { 'Enregistrer les informations professionnelles': 'professional', 'Changer le mot de passe': 'password', 'Appliquer la politique': 'instance-updates' };
const submit = (view, text) => view.fire((props, ownText, tag) => tag === 'form' && (ownText.includes(text) || props['data-form'] === formNames[text]), 'onSubmit');
const preferences = { messages: true, projects: true, calendar: true, theme: 'system', fontFamily: 'system', fontSize: 17, density: 'normal', homePage: 'dashboard', autoOpenNotifications: false };

test('preference writes retain drafts after refusal and accept only a complete confirmation', async t => {
  const calls = []; let reply = { messages: false };
  const view = panel(t, 'notifications', { savePreferences: async patch => { calls.push(patch); return reply; } });
  await change(view, 'input', 'messages', '', { checked: false });
  await view.click('Enregistrer les préférences');
  assert.match(view.text(), /n’ont pas été confirmées/);
  assert.equal(control(view, 'input', 'messages').props.checked, false);
  reply = { ...preferences, messages: false };
  await view.click('Enregistrer les préférences');
  assert.deepEqual(calls, [{ messages: false }, { messages: false }]);
  assert.match(view.text(), /Préférences enregistrées/);
  assert.equal(view.hostElements('Enregistrer les préférences').find(x => x.type === 'button').props.disabled, true);
});

test('professional drafts send changed fields and do not discard values on inconsistent receipts', async t => {
  const calls = []; let reply = {};
  const view = panel(t, 'profile', { saveExtendedProfile: async patch => { calls.push(patch); return reply; } });
  await change(view, 'input', 'service', 'Accueil');
  await change(view, 'input', 'position', 'Agent');
  await change(view, 'textarea', 'biography', 'Texte personnel');
  await submit(view, 'Enregistrer les informations professionnelles');
  assert.match(view.text(), /profil complémentaire n’a pas été confirmé/);
  reply = { service: 'Accueil', position: 'Agent', biography: 'Texte personnel' };
  await submit(view, 'Enregistrer les informations professionnelles');
  assert.deepEqual(calls, [reply, reply]);
  assert.match(view.text(), /Informations complémentaires enregistrées/);
});

test('photo selection validates size and type, releases previews, and requires a received URL', async t => {
  const urls = [];
  t.mock.method(URL, 'createObjectURL', () => 'blob:preview');
  t.mock.method(URL, 'revokeObjectURL', url => urls.push(url));
  let reply = ''; const calls = [];
  const view = panel(t, 'profile', { savePhoto: async file => { calls.push(file); return reply; } });
  await change(view, 'input', 'photo', '', { files: [new File(['bad'], 'bad.txt', { type: 'text/plain' })] });
  assert.match(view.text(), /Utilisez une photo JPG ou PNG/);
  assert.equal(calls.length, 0);
  const photo = new File(['image'], 'photo.png', { type: 'image/png' });
  await change(view, 'input', 'photo', '', { files: [photo] });
  await view.click('Enregistrer la photo');
  assert.match(view.text(), /photo enregistrée n’a pas été confirmée/);
  reply = 'https://example.test/photo.png';
  await view.click('Enregistrer la photo');
  assert.deepEqual(calls, [photo, photo]);
  assert.match(view.text(), /Photo enregistrée/);
  assert.ok(urls.includes('blob:preview'));
});

test('password submission validates confirmation and clears secrets only after a resolved write', async t => {
  const calls = []; let reject = true;
  const view = panel(t, 'security', { changePassword: async (...args) => { calls.push(args); if (reject) throw new Error('Refus de confirmation'); } });
  for (const [name, value] of [['current', 'old'], ['next', 'new'], ['confirmation', 'incorrect']]) await change(view, 'input', name, value);
  await submit(view, 'Changer le mot de passe');
  assert.match(view.text(), /ne correspondent pas/);
  assert.equal(calls.length, 0);
  await change(view, 'input', 'confirmation', 'new');
  await submit(view, 'Changer le mot de passe');
  assert.match(view.text(), /Refus de confirmation/);
  assert.equal(control(view, 'input', 'current').props.value, 'old');
  reject = false;
  await submit(view, 'Changer le mot de passe');
  assert.deepEqual(calls, [['old', 'new'], ['old', 'new']]);
  assert.match(view.text(), /Mot de passe modifié/);
  assert.ok(['current', 'next', 'confirmation'].every(name => control(view, 'input', name).props.value === ''));
});

test('MAIR-357: the second factor is managed in the Keycloak account console, never simulated in Settings', async t => {
  const view = panel(t, 'security', {}, { twoFactorUrl: 'https://auth.mairie.test/realms/mairie360/account' });
  const [link] = view.hostElements((props, text, tag) => tag === 'a' && text.includes('Gérer ma double authentification'));
  assert.equal(link.props.href, 'https://auth.mairie.test/realms/mairie360/account');
  assert.equal(link.props.target, undefined);
  assert.match(view.text(), /application d’authentification ou avec une clé de sécurité/);
  assert.doesNotMatch(view.text(), /SMS|Configurer la méthode|Vérifier et activer|codes de récupération|activée et confirmée/);
  assert.deepEqual(view.hostElements((props, text, tag) => tag === 'select'), []);
});

test('MAIR-357: without Keycloak the security tab says two-factor authentication is unavailable, with no fake state', async t => {
  const view = panel(t, 'security');
  assert.match(view.text(), /La double authentification n’est pas disponible sur cette instance\./);
  assert.deepEqual(view.hostElements((props, text, tag) => tag === 'a' && text.includes('double authentification')), []);
  assert.doesNotMatch(view.text(), /SMS|activée/);
});

test('MAIR-357: the account console URL is derived from the public realm URL only', () => {
  const { keycloakAccountUrl } = requireSrc('lib/keycloak-account.ts');
  assert.equal(keycloakAccountUrl('https://auth.mairie.test/realms/mairie360/'), 'https://auth.mairie.test/realms/mairie360/account');
  assert.equal(keycloakAccountUrl(' https://sso.example.org/realms/town '), 'https://sso.example.org/realms/town/account');
  assert.equal(keycloakAccountUrl('https://mairie.test/auth/realms/town'), 'https://mairie.test/auth/realms/town/account');
  assert.equal(keycloakAccountUrl('http://localhost:8080/realms/dev'), 'http://localhost:8080/realms/dev/account');
  for (const dangling of ['https://auth.mairie.test/realms/town?', 'https://auth.mairie.test/realms/town#', 'https://auth.mairie.test/realms/town/?#']) {
    assert.equal(keycloakAccountUrl(dangling), 'https://auth.mairie.test/realms/town/account', dangling);
  }
  for (const invalid of ['', '   ', 'not a url', 'javascript:alert(1)', 'ftp://auth.mairie.test/realms/x', 'http://auth.mairie.test/realms/x',
    'https://user:pw@auth.mairie.test/realms/x', 'https://auth.mairie.test/realms/x?next=1', 'https://auth.mairie.test/realms/x#a',
    'https://auth.mairie.test/', 'https://auth.mairie.test/realms/', 'https://auth.mairie.test/realms/town/account']) {
    assert.equal(keycloakAccountUrl(invalid), undefined, String(invalid));
  }
  const previous = process.env.KEYCLOAK_REALM_URL;
  process.env.KEYCLOAK_REALM_URL = 'https://auth.dev.mairie.test/realms/mairie360';
  try { assert.equal(keycloakAccountUrl(), 'https://auth.dev.mairie.test/realms/mairie360/account'); }
  finally { if (previous === undefined) delete process.env.KEYCLOAK_REALM_URL; else process.env.KEYCLOAK_REALM_URL = previous; }
});

test('instance policy shows received versions and preserves a refused choice until confirmation', async t => {
  const data = { currentVersion: '1.0', policy: 'automatic', maintenanceWindow: 'Dimanche', releases: [{ version: '1.1', notes: 'Notes reçues', supported: true }] };
  const calls = []; let accepted = false;
  const view = panel(t, 'system', { loadUpdates: async () => data, saveUpdates: async choice => { calls.push(choice); if (!accepted) throw new Error('Choix refusé'); return { ...data, policy: choice.policy, pinnedVersion: choice.version }; } });
  await view.waitFor(() => view.text().includes('Notes reçues'));
  await change(view, 'select', 'policy', 'pinned');
  await change(view, 'select', 'version', '1.1');
  await submit(view, 'Appliquer la politique');
  assert.match(view.text(), /Choix refusé/);
  accepted = true; await submit(view, 'Appliquer la politique');
  assert.match(view.text(), /Demande confirmée pour la prochaine fenêtre/);
  assert.deepEqual(calls, [{ policy: 'pinned', version: '1.1' }, { policy: 'pinned', version: '1.1' }]);
});

test('session revocation requires explicit confirmation and keeps refusal visible without notifying removal', async t => {
  const calls = []; const removed = [];
  // MAIR-607: the SessionList row action opens this dialog; nothing is sent before the confirmation.
  const view = mount(React.createElement(Revoke, { session: { id: 'received-session', device_info: 'Firefox' }, port: { revokeSession: async id => { calls.push(id); throw new Error('Session refusée'); } }, onRevoked: id => removed.push(id), onClose: () => {} }));
  t.after(() => view.unmount());
  assert.match(view.text(), /Déconnecter cette session \?/);
  assert.deepEqual(calls, []);
  await view.click('Confirmer la déconnexion');
  assert.match(view.text(), /Session refusée/);
  assert.deepEqual(calls, ['received-session']);
  assert.deepEqual(removed, []);
});
