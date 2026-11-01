import type { SettingsBootstrap, SettingsProfile, SettingsProfilePatch, SettingsAppearancePatch, SettingsGeneralPatch, SettingsNotificationsPatch } from '@mairie360/bff-settings-openapi/model';
import { bffSettings } from './bff-client';

// Types of the published BFF_Settings contract (@mairie360/bff-settings-openapi, exact version pinned in package.json).
export type { SettingsBootstrap, SettingsProfile, SettingsProfilePatch };

// Page calls to BFF_Settings, the only BFF of this front. Every call is a generated operation of the published
// package: no path string lives here (tests/network-contract.test.cjs and tests/settings.bff-mocks.test.cjs check it).

export async function loadSettings(signal?: AbortSignal) {
  try {
    return (await bffSettings.getSettingsBootstrap({ signal })).data;
  } catch (error) {
    // Axios reports a cancelled read as CanceledError; callers rely on the signal's own AbortError.
    signal?.throwIfAborted();
    throw error;
  }
}

export async function saveProfile(patch: SettingsProfilePatch) {
  return (await bffSettings.patchSettingsProfile(patch)).data;
}

export async function saveAppearance(patch: SettingsAppearancePatch) {
  return (await bffSettings.patchSettingsAppearance(patch)).data;
}

export async function saveGeneral(patch: SettingsGeneralPatch) {
  return (await bffSettings.patchSettingsGeneral(patch)).data;
}

export async function saveNotifications(patch: SettingsNotificationsPatch) {
  return (await bffSettings.patchSettingsNotifications(patch)).data;
}
