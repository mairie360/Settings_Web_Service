// Réponses BFF conformes aux contrats (validées dans network-contract.test.cjs) et session des tests.

const ACCESS_TOKEN = 'session-anne';

/** SettingsProfile (BFF_Settings). */
function profile(overrides = {}) {
  return { first_name: 'Anne Marie', last_name: 'Le Gall', email: 'anne.le-gall@mairie.test', phone: '+33123456789', ...overrides };
}

/** Élément de SettingsBootstrap.sessions (BFF_Settings). */
function session(id, overrides = {}) {
  return {
    id,
    device_info: 'Firefox sur Linux',
    ip_address: '192.0.2.10',
    created_at: '2026-09-15T08:00:00Z',
    expires_at: '2026-09-22T08:00:00Z',
    revoked_at: null,
    ...overrides,
  };
}

/** SettingsBootstrap (BFF_Settings). */
function bootstrap(overrides = {}) {
  return { profile: profile(), sessions: [session('s-1')], sources: { sessions: 'available' }, ...overrides };
}

/** Error (BFF_Settings). */
function error(message) {
  return { error: { message } };
}

/**
 * Réponse de succès conforme pour chaque opération du contrat BFF_Settings, et corps envoyé par le navigateur.
 * Une opération ajoutée au contrat sans entrée ici fait échouer les tests : il faut la mocker explicitement.
 */
const SETTINGS_OPERATIONS = {
  'GET /health': { reply: { body: { status: 'ok' } } },
  'GET /check_apis': { reply: { body: { status: 'OK', core_api: 'Connected' } } },
  'GET /settings/bootstrap': { reply: { body: bootstrap() } },
  'PATCH /settings/profile': { send: { first_name: 'Anne' }, reply: { body: profile({ first_name: 'Anne' }) } },
  'PATCH /settings/notifications': { send: { emailDigest: false }, reply: { body: { emailDigest: false } } },
  'PATCH /settings/appearance': { send: { theme: 'dark' }, reply: { body: { theme: 'dark' } } },
  'PATCH /settings/general': { send: { language: 'fr' }, reply: { body: { language: 'fr' } } },
};

module.exports = { ACCESS_TOKEN, profile, session, bootstrap, error, SETTINGS_OPERATIONS };
