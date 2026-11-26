"use client";
import { UserRound } from "lucide-react";
import { Fragment, useEffect } from "react";
import { CancelButton, FormActions, Panel, PasswordField, ProfilePhotoField, SaveButton, TextArea, TextField } from "@mairie360/lib-components/primitives";

import { CURRENT_PASSWORD, PROFILE_FIELDS, SERVICE_FIELD } from '@/lib/profile-form';
import { PHOTO_ACCEPT, PHOTO_PICK_MAX_BYTES } from '@/lib/profile-photo';
import SettingsMutationForm from '../SettingsMutationForm';
import type { ProfileForm as ProfileFormState } from '../../use-profile-form';

export interface ProfileFormProps {
  form: ProfileFormState;
  reading: boolean;
}

const changedStatus = (count: number) => count === 0
  ? "Aucune modification à enregistrer."
  : `${count} champ${count > 1 ? "s" : ""} modifié${count > 1 ? "s" : ""}.`;

/** Initials of the agent, shown by the photo field when there is no photo. */
const initialsOf = (firstName: string, lastName: string) => `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();

/**
 * The single « Informations personnelles » card (Figma 01 Profil): the profile photo, the contract-backed fields in
 * a two-column grid with their errors underneath (the service, set by the administration, read-only before the
 * function; the biography on the full width), the e-mail confirmation password, and Annuler / Enregistrer.
 */
export const ProfileForm = ({ form, reading }: ProfileFormProps) => {
  const { profile, saving, hasChanges, changedCount, emailChanged, currentPassword, fieldErrors, focusTarget, setCurrentPassword, updateProfile, cancel, save, photoUrl, photoError, choosePhoto } = form;
  // After a refused save, the first field in error takes the focus (parcours P2).
  useEffect(() => {
    if (focusTarget && typeof document !== "undefined") document.getElementById(`settings-${focusTarget}`)?.focus?.();
  }, [focusTarget, fieldErrors]);
  if (!profile) return null;
  return (
    <Panel icon={UserRound} title="Informations personnelles" description="Ces informations sont visibles par les autres agents de la mairie." className="settings-profile-card">
      <SettingsMutationForm data-form="settings-profile" onSubmit={save} aria-busy={saving || reading} noValidate className="space-y-4">
        <ProfilePhotoField id="settings-photo" label="Photo de profil" className="settings-profile-photo" value={photoUrl} initials={initialsOf(profile.first_name, profile.last_name)}
          accept={PHOTO_ACCEPT} maxSize={PHOTO_PICK_MAX_BYTES} error={photoError ?? undefined} disabled={saving} onChange={(file) => { void choosePhoto(file); }} />
        <div className="settings-profile-fields">
          {PROFILE_FIELDS.map(({ field, label, type, required, maxLength, pattern, help }) => type === "textarea" ? (
            <TextArea key={field} id={`settings-${field}`} label={label} name={field} className="settings-profile-wide" placeholder="Quelques mots sur vous…" disabled={saving} maxLength={maxLength} hint={help} error={fieldErrors[field]} value={profile[field] ?? ""} onChange={(event) => updateProfile(field, event.target.value)} />
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
        {/* Both actions follow the draft: disabled while nothing changed (FormActions only disables Cancel while busy). */}
        <FormActions sticky status={changedStatus(changedCount)} className="settings-profile-actions">
          <CancelButton onClick={cancel} disabled={saving || !hasChanges} />
          <SaveButton type="submit" label={saving ? "Enregistrement…" : "Enregistrer"} loading={saving} disabled={saving || reading || !hasChanges} />
        </FormActions>
      </SettingsMutationForm>
    </Panel>
  );
};
