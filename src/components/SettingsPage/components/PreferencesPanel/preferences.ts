import type { SettingsAppearance, SettingsGeneral, SettingsNotifications } from '@mairie360/bff-settings-openapi/model';
import type { SettingsBootstrapRead as SettingsBootstrap } from '@/lib/settings-bootstrap';

/** The three preference sections of BFF_Settings, as the tabs edit them. `null` means « default of the account ». */
export type Values = { appearance: SettingsAppearance; general: SettingsGeneral; notifications: SettingsNotifications };
export type PreferenceSection = keyof Values;

export const emptyPreferences: Values = {
  appearance: { theme: null, font_family: null, font_size: null, density: null },
  general: { language: null, timezone: null, date_format: null, home_page: null, auto_open_notifications: null, autosave: null },
  notifications: { email: null, push: null, desktop: null, messages: null, projects: null, calendar: null, system_updates: null, login_alerts: null },
};

/** Closed lists of the V2 mock-up (MAIR-912, MAIR-921). The values are the ones BFF_Settings accepts. */
export const choices = {
  font_family: [{ value: 'system', label: 'Police système' }, { value: 'geist', label: 'Geist' }, { value: 'atkinson', label: 'Atkinson Hyperlegible' }],
  density: [{ value: 'compact', label: 'Compacte' }, { value: 'normal', label: 'Normale' }, { value: 'comfortable', label: 'Confortable' }],
  language: [{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }, { value: 'es', label: 'Español' }],
  timezone: [{ value: 'Europe/Paris', label: 'Paris (Europe/Paris)' }, { value: 'Indian/Reunion', label: 'La Réunion (Indian/Reunion)' }, { value: 'America/Cayenne', label: 'Cayenne (America/Cayenne)' }, { value: 'Pacific/Noumea', label: 'Nouméa (Pacific/Noumea)' }],
  date_format: [{ value: 'DD/MM/YYYY', label: 'JJ/MM/AAAA' }, { value: 'YYYY-MM-DD', label: 'AAAA-MM-JJ' }],
  // Core stores the home page as a path of the application (MAIR-479): `/dashboard`, never `dashboard`.
  home_page: [{ value: '/dashboard', label: 'Tableau de bord' }, { value: '/projects', label: 'Projets' }, { value: '/calendar', label: 'Calendrier' }, { value: '/messages', label: 'Messagerie' }],
} as const;

/** Defaults shown while a field holds `null` (the account default): normal text size, system font, normal density, French, Paris. */
export const defaults = { font_size: 16, font_family: 'system', density: 'normal', language: 'fr', timezone: 'Europe/Paris', date_format: 'DD/MM/YYYY', home_page: '/dashboard' } as const;
export const FONT_SIZE = { min: 14, max: 24 } as const;

// Bootstrap reads may omit values; PATCH receipts must contain every contracted field.
export function validPreferences<K extends PreferenceSection>(section: K, value: unknown, complete = false): value is Values[K] {
  if (value == null) return !complete;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(emptyPreferences[section]).every(key => {
    if (record[key] === undefined) return !complete;
    if (record[key] === null) return true;
    if (section === 'notifications' || key === 'auto_open_notifications' || key === 'autosave') return typeof record[key] === 'boolean';
    if (key === 'font_size') return typeof record[key] === 'number' && Number.isInteger(record[key]) && (record[key] as number) >= 1 && (record[key] as number) <= 32767;
    if (key === 'theme') return ['light', 'dark', 'system'].includes(record[key] as string);
    return typeof record[key] === 'string';
  });
}

export function preferencesAvailable(bootstrap: SettingsBootstrap, section: PreferenceSection) {
  return bootstrap.sources[section === 'notifications' ? 'notifications' : 'preferences'] === 'available' && validPreferences(section, bootstrap[section]);
}

export function readSection<K extends PreferenceSection>(bootstrap: SettingsBootstrap, section: K): Values[K] {
  if (!preferencesAvailable(bootstrap, section)) return emptyPreferences[section];
  const raw = bootstrap[section] as unknown as Record<string, unknown> | null;
  return Object.fromEntries(Object.keys(emptyPreferences[section]).map(key => [key, raw?.[key] ?? null])) as unknown as Values[K];
}

/** A stored value outside the closed list (an older free text) reads as the default. */
export function listValue<K extends keyof typeof choices>(list: K, value: string | null | undefined): string {
  const options = choices[list] as ReadonlyArray<{ value: string }>;
  return value && options.some(option => option.value === value) ? value : (defaults as unknown as Record<string, string>)[list];
}
