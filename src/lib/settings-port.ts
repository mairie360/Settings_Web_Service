import { BffRequestError } from './bff-client';
import * as api from './settings-api';
import type { SettingsFeaturePort } from './settings-features';

/** French reason of a refused password change (MAIR-876): never the upstream text. */
export function passwordFailure(error: unknown) {
  if (error instanceof BffRequestError) {
    if (error.status === 403) return 'Le mot de passe actuel est incorrect, ou ce compte n’a pas de mot de passe.';
    if (error.status === 429) return 'Trop de tentatives. Réessayez dans quelques minutes.';
    if (error.status === 400) return 'Le nouveau mot de passe doit contenir entre 8 et 255 caractères et être différent de l’actuel.';
  }
  return 'Le mot de passe n’a pas été modifié. Réessayez.';
}

/** The feature port wired to BFF_Settings (MAIR-823): the password change goes through `POST /settings/password`. */
export const settingsPort: SettingsFeaturePort = {
  async changePassword(current, next) {
    try { await api.changePassword({ current_password: current, new_password: next }); }
    catch (error) { throw new Error(passwordFailure(error)); }
  },
};
