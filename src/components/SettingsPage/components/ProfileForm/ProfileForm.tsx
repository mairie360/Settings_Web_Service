"use client";
import { UserRound } from "lucide-react";
import { Fragment, useEffect } from "react";
import { CancelButton, FormActions, Panel, PasswordField, SaveButton, TextArea, TextField } from "@mairie360/lib-components/primitives";

import { CURRENT_PASSWORD, PROFILE_FIELDS, SERVICE_FIELD } from '@/lib/profile-form';
import SettingsMutationForm from '../SettingsMutationForm';
import { ProfilePhotoCard } from './components/ProfilePhotoCard';
import type { ProfileForm as ProfileFormState } from '../../use-profile-form';

export interface ProfileFormProps {
  form: ProfileFormState;
  reading: boolean;
}

const changedStatus = (count: number) => count === 0
  ? "Aucune modification à enregistrer."
  : `${count} champ${count > 1 ? "s" : ""} modifié${count > 1 ? "s" : ""}.`;

/** Bio hint of the artifact: the limit, then the count once something is written. */
export const biographyHint = (value: string | null | undefined, maxLength = 1000) =>
  `${maxLength} caractères maximum${value ? ` (${value.length} / ${maxLength})` : ""}.`;

/**
 * The profile tab of the artifact, on two columns inside one form (the photo is saved with the fields):
 * the « Photo de profil » card with the directory preview on the left, the « Informations personnelles » card
 * on the right (the contract-backed fields on a three-column grid, required ones marked « * », the service set
 * by the administration read-only before the function, the biography on the full width, the e-mail confirmation
 * password) ending with the sticky Annuler / Enregistrer bar.
 */
export const ProfileForm = ({ form, reading }: ProfileFormProps) => {
  const { profile, saving, hasChanges, changedCount, emailChanged, currentPassword, fieldErrors, focusTarget, setCurrentPassword, updateProfile, cancel, save, photoUrl, photoError, choosePhoto } = form;
  // After a refused save, the first field in error takes the focus (parcours P2).
  useEffect(() => {
    if (focusTarget && typeof document !== "undefined") document.getElementById(`settings-${focusTarget}`)?.focus?.();
  }, [focusTarget, fieldErrors]);
  if (!profile) return null;
  return (
    <SettingsMutationForm data-form="settings-profile" onSubmit={save} aria-busy={saving || reading} noValidate className="settings-profile-grid">
      <ProfilePhotoCard profile={profile} photoUrl={photoUrl} photoError={photoError} disabled={saving} onPhoto={(file) => { void choosePhoto(file); }} />
      <Panel icon={UserRound} title="Informations personnelles" description="Ces informations sont visibles par les autres agents de la mairie." className="settings-profile-card" fill>
        <div className="settings-profile-fields">
          {PROFILE_FIELDS.map(({ field, label, type, required, maxLength, pattern, help }) => type === "textarea" ? (
            <TextArea key={field} id={`settings-${field}`} label={label} name={field} className="settings-profile-wide" placeholder="Quelques mots sur vous…" disabled={saving} maxLength={maxLength} hint={help ?? biographyHint(profile[field], maxLength)} error={fieldErrors[field]} value={profile[field] ?? ""} onChange={(event) => updateProfile(field, event.target.value)} />
          ) : (
            <Fragment key={field}>
              {field === "job_title" ? (
                <TextField id="settings-service" label={SERVICE_FIELD.label} name="service" readOnly disabled hint={SERVICE_FIELD.help} value={profile.service?.name ?? SERVICE_FIELD.none} />
              ) : null}
              <TextField id={`settings-${field}`} label={label} type={type as "text" | "email" | "tel"} name={field} required={required} disabled={saving} maxLength={maxLength} pattern={pattern} hint={help} error={fieldErrors[field]} value={profile[field] ?? ""} onChange={(event) => updateProfile(field, event.target.value)} />
              {field === "email" && emailChanged ? (
                <PasswordField id="settings-current_password" label={CURRENT_PASSWORD.label} name={CURRENT_PASSWORD.field} autoComplete="current-password" required disabled={saving} maxLength={CURRENT_PASSWORD.maxLength} hint={CURRENT_PASSWORD.help} error={fieldErrors.current_password} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              ) : null}
            </Fragment>
          ))}
        </div>
        {/* Both actions follow the draft (FormActions only disables Cancel while busy). Sticky above the bottom edge
            of the scrolling area, it stands out once something changed; the page keeps room under it (globals.css)
            so it never hides the field being edited. */}
        <FormActions sticky dirty={hasChanges} status={changedStatus(changedCount)} className="settings-profile-actions">
          <CancelButton onClick={cancel} disabled={saving || !hasChanges} />
          <SaveButton type="submit" label={saving ? "Enregistrement…" : "Enregistrer"} loading={saving} disabled={saving || reading || !hasChanges} />
        </FormActions>
      </Panel>
    </SettingsMutationForm>
  );
};
