// Réponses BFF conformes aux contrats (validées dans network-contract.test.cjs) et session des tests.

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const ACCESS_TOKEN = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`;

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

/** SettingsAppearance (BFF_Settings). */
function appearance(overrides = {}) {
  return { theme: 'system', density: 'normal', font_family: 'Marianne', font_size: 16, ...overrides };
}

/** SettingsGeneral (BFF_Settings). */
function general(overrides = {}) {
  return { language: 'fr', timezone: 'Europe/Paris', date_format: 'DD/MM/YYYY', home_page: 'dashboard', auto_open_notifications: false, ...overrides };
}

/** SettingsNotifications (BFF_Settings). */
function notifications(overrides = {}) {
  return { email: true, push: false, desktop: true, messages: true, projects: true, calendar: false, ...overrides };
}

/** SettingsBootstrap (BFF_Settings). `sources` is merged key by key so a test can override one source only. */
function bootstrap(overrides = {}) {
  const { sources, ...rest } = overrides;
  return {
    profile: profile(),
    sessions: [session('s-1')],
    appearance: appearance(),
    general: general(),
    notifications: notifications(),
    sources: sources && typeof sources === 'object' && !Array.isArray(sources)
      ? { sessions: 'available', preferences: 'available', notifications: 'available', ...sources }
      : sources === undefined ? { sessions: 'available', preferences: 'available', notifications: 'available' } : sources,
    ...rest,
  };
}

const ERROR_CODES = { 400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 429: 'TOO_MANY_REQUESTS', 500: 'INTERNAL_ERROR', 502: 'BAD_GATEWAY', 503: 'SERVICE_UNAVAILABLE', 504: 'GATEWAY_TIMEOUT' };

/** ErrorResponse (BFF_Settings) : enveloppe d'erreur commune aux BFFs, { error: { code, message, details } }. */
function error(message, status = 500) {
  return { error: { code: ERROR_CODES[status] ?? 'INTERNAL_ERROR', message, details: [] } };
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
  'PATCH /settings/notifications': { send: { email: false }, reply: { body: notifications({ email: false }) } },
  'PATCH /settings/appearance': { send: { theme: 'dark' }, reply: { body: appearance({ theme: 'dark' }) } },
  'PATCH /settings/general': { send: { language: 'fr' }, reply: { body: general() } },
  // MAIR-807: second factor.
  'GET /settings/2fa': { reply: { body: { enabled: true, backup_codes_remaining: 8 } } },
  'POST /settings/2fa/setup': { reply: { body: { secret: 'JBSWY3DPEHPK3PXP', otpauth_uri: 'otpauth://totp/Mairie360:agent?secret=JBSWY3DPEHPK3PXP&issuer=Mairie360' } } },
  'POST /settings/2fa/confirm': { send: { code: '123456' }, reply: { body: { backup_codes: Array.from({ length: 10 }, (_, index) => `ab${index}c-d${index}ef`) } } },
  'POST /settings/2fa/disable': { send: { password: 'secret', code: '123456' }, reply: { status: 204 } },
  'POST /settings/2fa/backup-codes': { send: { code: '123456' }, reply: { body: { backup_codes: Array.from({ length: 10 }, (_, index) => `cd${index}e-f${index}gh`) } } },
  // MAIR-811: passkeys.
  'GET /settings/passkeys': { reply: { body: [{ id: 12, label: 'Ordinateur de la mairie', provider: 'Google Password Manager', created_at: '2026-11-17T09:30:00+00:00', last_used_at: null }] } },
  'POST /settings/passkeys/options': { reply: { body: { options: { publicKey: { challenge: 'Y2hhbGxlbmdl', user: { id: 'dXNlcg', name: 'agent', displayName: 'Agent' } } } } } },
  'POST /settings/passkeys': { send: { label: 'Téléphone', credential: { id: 'cred' } }, reply: { status: 201, body: { id: 13, label: 'Téléphone', provider: null, created_at: '2026-11-17T09:30:00+00:00', last_used_at: null } } },
  'DELETE /settings/passkeys/{id}': { path: '/settings/passkeys/12', reply: { status: 204 } },
};

module.exports = { ACCESS_TOKEN, profile, session, appearance, general, notifications, bootstrap, error, SETTINGS_OPERATIONS };
