import type { SettingsBootstrap, SettingsProfile, SettingsProfilePatch } from '@mairie360/bff-settings-openapi/model';
import { requestBff } from './bff-client';

// Types du contrat publié de BFF_Settings (@mairie360/bff-settings-openapi, version exacte épinglée dans package.json).
export type { SettingsBootstrap, SettingsProfile, SettingsProfilePatch };

// Appels de la page vers BFF_Settings, seul BFF de ce front. Chaque chemin et méthode est une opération du paquet
// publié (tests/network-contract.test.cjs et tests/settings.bff-mocks.test.cjs le vérifient).

export function loadSettings(signal?: AbortSignal) {
  return requestBff<SettingsBootstrap>('/settings/bootstrap', { signal });
}

export function saveProfile(patch: SettingsProfilePatch) {
  return requestBff<SettingsProfile>('/settings/profile', { method: 'PATCH', body: JSON.stringify(patch) });
}
