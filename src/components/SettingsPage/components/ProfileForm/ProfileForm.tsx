"use client";
import { UserRound } from "lucide-react";
import { Fragment, useEffect } from "react";
import { CancelButton, FormActions, Panel, PasswordField, SaveButton, TextField } from "@mairie360/lib-components/primitives";

import { CURRENT_PASSWORD, PROFILE_FIELDS } from '@/lib/profile-form';
import SettingsMutationForm from '../SettingsMutationForm';
import type { ProfileForm as ProfileFormState } from '../../use-profile-form';

export interface ProfileFormProps {
  form: ProfileFormState;
  reading: boolean;
}

const changedStatus = (count: number) => count === 0
  ? "Aucune modification à enregistrer."
  : `${count} champ${count > 1 ? "s" : ""} modifié${count > 1 ? "s" : ""}.`;

/**
 * The single « Informations personnelles » card (MAIR-864, Figma 01 Profil): the contract-backed fields in a
 * two-column grid with their errors underneath, the e-mail confirmation password, and Annuler / Enregistrer.
 */
export const ProfileForm = ({ form, reading }: ProfileFormProps) => {
  const { profile, saving, hasChanges, changedCount, emailChanged, currentPassword, fieldErrors, focusTarget, setCurrentPassword, updateProfile, cancel, save } = form;
  // After a refused save, the first field in error takes the focus (parcours P2).
  useEffect(() => {
    if (focusTarget && typeof document !== "undefined") document.getElementById(`settings-${focusTarget}`)?.focus?.();
  }, [focusTarget, fieldErrors]);
  if (!profile) return null;
  return (
    <Panel icon={UserRound} title="Informations personnelles" description="Ces informations sont utilisées pour votre compte Mairie360." className="settings-profile-card">
      <SettingsMutationForm data-form="settings-profile" onSubmit={save} aria-busy={saving || reading} noValidate className="space-y-4">
        <div className="settings-profile-fields">
          {PROFILE_FIELDS.map(({ field, label, type, required, maxLength, pattern, help }) => (
            <Fragment key={field}>
              <TextField id={`settings-${field}`} label={label} type={type as "text" | "email" | "tel"} name={field} required={required} disabled={saving} maxLength={maxLength} pattern={pattern} hint={help} error={fieldErrors[field]} value={profile[field] ?? ""} onChange={(event) => updateProfile(field, event.target.value)} />
              {field === "email" && emailChanged ? (
                <PasswordField id="settings-current_password" label={CURRENT_PASSWORD.label} name={CURRENT_PASSWORD.field} autoComplete="current-password" required disabled={saving} maxLength={CURRENT_PASSWORD.maxLength} hint={CURRENT_PASSWORD.help} error={fieldErrors.current_password} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              ) : null}
            </Fragment>
          ))}
        </div>
        {/* Both actions follow the draft: disabled while nothing changed (FormActions only disables Cancel while busy). */}
        <FormActions sticky status={changedStatus(changedCount)} className="settings-profile-actions">
          <CancelButton onClick={cancel} disabled={saving || !hasChanges} />
          <SaveButton type="submit" label={saving ? "Enregistrement…" : "Enregistrer"} loading={saving} disabled={saving || reading || !hasChanges} />
        </FormActions>
      </SettingsMutationForm>
    </Panel>
  );
};
