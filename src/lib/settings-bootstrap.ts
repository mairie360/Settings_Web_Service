import type { SettingsBootstrap as Bootstrap, SettingsProfile as Profile } from '@mairie360/bff-settings-openapi/model';

// Reads historically permit omitted preference fields; null still means inherit.
// This view type describes that boundary without claiming a complete PATCH receipt.
type PreferenceSection = 'appearance' | 'general' | 'notifications';
export type SettingsBootstrapRead = Pick<Bootstrap, 'profile' | 'sessions'> & Partial<Pick<Bootstrap, 'session_history' | 'current_session_id'>> & {
  sources: Pick<Bootstrap['sources'], 'sessions'> & Partial<Omit<Bootstrap['sources'], 'sessions'>>;
} & { [K in PreferenceSection]?: Partial<NonNullable<Bootstrap[K]>> | null };

export function isConfirmedProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const profile = value as Record<string, unknown>;
  return typeof profile.first_name === "string"
    && typeof profile.last_name === "string"
    && typeof profile.email === "string"
    && (profile.phone === undefined || profile.phone === null || typeof profile.phone === "string");
}

export function isConfirmedBootstrap(value: unknown): value is SettingsBootstrapRead {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const bootstrap = value as Record<string, unknown>;
  if (!isConfirmedProfile(bootstrap.profile) || !Array.isArray(bootstrap.sessions)) return false;
  if (!bootstrap.sources || typeof bootstrap.sources !== "object" || Array.isArray(bootstrap.sources)) return false;
  const sources = bootstrap.sources as Record<string, unknown>;
  if (sources.sessions !== "available" && sources.sessions !== "unavailable") return false;
  return bootstrap.sessions.every((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const session = value as Record<string, unknown>;
    return ["id", "device_info", "ip_address", "created_at", "expires_at"]
      .every((field) => typeof session[field] === "string")
      && (session.revoked_at === undefined || session.revoked_at === null || typeof session.revoked_at === "string");
  });
}

// Select only contracted scalar fields before crossing the server/client boundary.
const fields = <T extends object, K extends keyof T>(record: T, keys: K[]): Pick<T, K> => Object.fromEntries(
  keys.filter(key => key in record).map(key => [key, record[key]]),
) as Pick<T, K>;
const preferenceFields = {
  appearance: ['theme', 'density', 'font_family', 'font_size'],
  general: ['language', 'timezone', 'date_format', 'home_page', 'auto_open_notifications', 'autosave'],
  notifications: ['email', 'push', 'desktop', 'messages', 'projects', 'calendar', 'system_updates', 'login_alerts'],
};

export function selectSettingsBootstrap(value: unknown): SettingsBootstrapRead | null {
  if (!isConfirmedBootstrap(value)) return null;
  if (![value.sources.preferences, value.sources.notifications]
    .every(source => source === undefined || source === 'available' || source === 'unavailable')) return null;
  if (value.profile.phone_country != null && typeof value.profile.phone_country !== 'string') return null;
  // MAIR-892: the history and the current session id are optional; a malformed one is dropped, never the page.
  const record = value as unknown as Record<string, unknown>;
  const history = Array.isArray(record.session_history) && isConfirmedBootstrap({ ...value, sessions: record.session_history })
    ? (record.session_history as SettingsBootstrapRead['sessions']) : undefined;
  const currentSession = typeof record.current_session_id === 'string' ? record.current_session_id : null;
  const optional: Record<string, unknown> = {};
  for (const section of ['appearance', 'general', 'notifications'] as const) {
    const raw = value[section];
    if (raw == null) { if (section in value) optional[section] = raw; continue; }
    if (typeof raw !== 'object' || Array.isArray(raw)) return null;
    const selected = fields(raw as Record<string, unknown>, preferenceFields[section]);
    for (const [key, field] of Object.entries(selected)) {
      if (field == null) continue;
      if (section === 'notifications' || key === 'auto_open_notifications' || key === 'autosave') {
        if (typeof field !== 'boolean') return null;
      } else if (key === 'font_size') {
        if (typeof field !== 'number' || !Number.isInteger(field) || field < 1 || field > 32767) return null;
      } else if (typeof field !== 'string' || (key === 'theme' && !['light', 'dark', 'system'].includes(field))) return null;
    }
    optional[section] = selected;
  }
  // MAIR-1258: the account band and the profile form read these on the first render, so they cross the boundary too
  // (scalars of the published shape only; the service keeps its id and name).
  const profile = value.profile as unknown as Record<string, unknown>;
  for (const key of ['pending_email', 'biography', 'job_title'] as const) {
    if (profile[key] != null && typeof profile[key] !== 'string') return null;
  }
  if (profile.has_photo !== undefined && typeof profile.has_photo !== 'boolean') return null;
  const service = profile.service;
  if (service != null && (typeof service !== 'object' || typeof (service as { name?: unknown }).name !== 'string'
    || typeof (service as { id?: unknown }).id !== 'number')) return null;
  return {
    profile: {
      ...fields(value.profile, ['first_name', 'last_name', 'email', 'phone', 'phone_country', 'pending_email', 'biography', 'job_title', 'has_photo']),
      ...('service' in value.profile ? { service: value.profile.service ? fields(value.profile.service, ['id', 'name']) : value.profile.service } : {}),
    },
    sessions: value.sessions.map(session => fields(session, ['id', 'device_info', 'ip_address', 'created_at', 'expires_at', 'revoked_at'])),
    ...(history ? { session_history: history.map(session => fields(session, ['id', 'device_info', 'ip_address', 'created_at', 'expires_at', 'revoked_at'])) } : {}),
    current_session_id: currentSession,
    sources: { ...fields(value.sources, ['sessions', 'preferences', 'notifications']), ...(history ? { session_history: value.sources.session_history ?? 'available' } : { session_history: 'unavailable' as const }) },
    ...optional,
  } as SettingsBootstrapRead;
}
