import type { SettingsBootstrap as Bootstrap, SettingsProfile as Profile } from '@mairie360/bff-settings-openapi/model';

// Reads historically permit omitted preference fields; null still means inherit.
// This view type describes that boundary without claiming a complete PATCH receipt.
type PreferenceSection = 'appearance' | 'general' | 'notifications';
export type SettingsBootstrapRead = Pick<Bootstrap, 'profile' | 'sessions'> & {
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
  general: ['language', 'timezone', 'date_format', 'home_page', 'auto_open_notifications'],
  notifications: ['email', 'push', 'desktop', 'messages', 'projects', 'calendar'],
};

export function selectSettingsBootstrap(value: unknown): SettingsBootstrapRead | null {
  if (!isConfirmedBootstrap(value)) return null;
  if (![value.sources.preferences, value.sources.notifications]
    .every(source => source === undefined || source === 'available' || source === 'unavailable')) return null;
  if (value.profile.phone_country != null && typeof value.profile.phone_country !== 'string') return null;
  const optional: Record<string, unknown> = {};
  for (const section of ['appearance', 'general', 'notifications'] as const) {
    const raw = value[section];
    if (raw == null) { if (section in value) optional[section] = raw; continue; }
    if (typeof raw !== 'object' || Array.isArray(raw)) return null;
    const selected = fields(raw as Record<string, unknown>, preferenceFields[section]);
    for (const [key, field] of Object.entries(selected)) {
      if (field == null) continue;
      if (section === 'notifications' || key === 'auto_open_notifications') {
        if (typeof field !== 'boolean') return null;
      } else if (key === 'font_size') {
        if (typeof field !== 'number' || !Number.isInteger(field) || field < 1 || field > 32767) return null;
      } else if (typeof field !== 'string' || (key === 'theme' && !['light', 'dark', 'system'].includes(field))) return null;
    }
    optional[section] = selected;
  }
  return {
    profile: fields(value.profile, ['first_name', 'last_name', 'email', 'phone', 'phone_country']),
    sessions: value.sessions.map(session => fields(session, ['id', 'device_info', 'ip_address', 'created_at', 'expires_at', 'revoked_at'])),
    sources: fields(value.sources, ['sessions', 'preferences', 'notifications']),
    ...optional,
  } as SettingsBootstrapRead;
}
