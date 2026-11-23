import type { SettingsBootstrap, SettingsProfile, SettingsProfilePatch, SettingsAppearancePatch, SettingsGeneralPatch, SettingsNotificationsPatch, SettingsPasskey, SettingsPasskeyRegister, SettingsTwoFactorDisable, SettingsTwoFactorSetup, SettingsTwoFactorStatus } from '@mairie360/bff-settings-openapi/model';
import { bffSettings } from './bff-client';

// Types of the published BFF_Settings contract (@mairie360/bff-settings-openapi, exact version pinned in package.json).
export type { SettingsBootstrap, SettingsProfile, SettingsProfilePatch, SettingsPasskey, SettingsTwoFactorSetup, SettingsTwoFactorStatus };

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

// Second factor (MAIR-807): status, enrolment (secret then first code), backup codes, deactivation.
export async function loadTwoFactor() {
  return (await bffSettings.getSettings2fa()).data;
}

export async function startTwoFactor() {
  return (await bffSettings.postSettings2faSetup()).data;
}

export async function confirmTwoFactor(code: string) {
  return (await bffSettings.postSettings2faConfirm({ code })).data;
}

export async function regenerateBackupCodes(code: string) {
  return (await bffSettings.postSettings2faBackupCodes({ code })).data;
}

export async function disableTwoFactor(body: SettingsTwoFactorDisable) {
  await bffSettings.postSettings2faDisable(body);
}

// Passkeys (MAIR-811): list, creation options, registration of the browser answer, deletion.
export async function loadPasskeys() {
  return (await bffSettings.getSettingsPasskeys()).data;
}

export async function passkeyOptions() {
  return (await bffSettings.postSettingsPasskeysOptions()).data;
}

export async function registerPasskey(body: SettingsPasskeyRegister) {
  return (await bffSettings.postSettingsPasskeys(body)).data;
}

export async function deletePasskey(id: number) {
  await bffSettings.deleteSettingsPasskeysId(id);
}
