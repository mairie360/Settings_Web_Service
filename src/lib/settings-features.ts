// Frontend models only. They are deliberately separate from the published SDK.
export type SettingsPreferences = {
  messages: boolean; projects: boolean; calendar: boolean;
  theme: 'light' | 'dark' | 'system'; fontFamily: 'system' | 'sans' | 'serif';
  fontSize: number; density: 'compact' | 'normal' | 'comfortable';
  homePage: 'dashboard' | 'projects' | 'calendar' | 'messages'; autoOpenNotifications: boolean;
};
export type ExtendedProfile = { service: string; position: string; biography: string };
export interface InstanceUpdates {
  currentVersion: string;
  policy: 'automatic' | 'pinned';
  pinnedVersion?: string;
  maintenanceWindow: string;
  releases: { version: string; notes: string; supported: boolean }[];
}
export interface SettingsFeaturePort {
  savePreferences?: (patch: Partial<SettingsPreferences>) => Promise<SettingsPreferences>;
  saveExtendedProfile?: (patch: Partial<ExtendedProfile>) => Promise<ExtendedProfile>;
  savePhoto?: (photo: File) => Promise<string>;
  changePassword?: (current: string, next: string) => Promise<void>;
  revokeSession?: (id: string) => Promise<void>;
  loadUpdates?: (signal: AbortSignal) => Promise<InstanceUpdates>;
  saveUpdates?: (choice: { policy: 'automatic' | 'pinned'; version?: string }) => Promise<InstanceUpdates>;
}

export const pendingSettingsPort: SettingsFeaturePort = {};
export const pendingFeatureMessage = 'Cette action n’est pas encore disponible. Votre saisie est conservée ; aucune modification du compte n’a été enregistrée.';

export function changedFields<T extends object>(baseline: T, draft: T): Partial<T> {
  return Object.fromEntries(Object.keys(draft).filter(key => baseline[key as keyof T] !== draft[key as keyof T]).map(key => [key, draft[key as keyof T]])) as Partial<T>;
}

export function validatePassword(current: string, next: string, confirmation: string) {
  if (!current || !next || !confirmation) return 'Tous les champs de mot de passe sont obligatoires.';
  if (next !== confirmation) return 'Les nouveaux mots de passe ne correspondent pas.';
  if (next === current) return 'Choisissez un mot de passe différent du mot de passe actuel.';
  return '';
}

export function validatePhoto(file: File) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Utilisez une photo JPG ou PNG.';
  if (!file.size || file.size > 2 * 1024 * 1024) return 'La photo doit contenir entre 1 octet et 2 Mo.';
  return '';
}
