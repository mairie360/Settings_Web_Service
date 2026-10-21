"use client";
import { Fragment } from "react";
import { Help, PasswordField, SaveButton, TextField } from "@mairie360/lib-components/primitives";

import { CURRENT_PASSWORD, PROFILE_FIELDS } from "@/lib/profile-form";
import SettingsMutationForm from "../shared/SettingsMutationForm";
import type { ProfileForm as ProfileFormState } from "../page/use-profile-form";

export interface ProfileFormProps {
  form: ProfileFormState;
  reading: boolean;
}

/** The four contract-backed profile fields, the e-mail confirmation password and the save action (Figma 01 Profil). */
export const ProfileForm = ({ form, reading }: ProfileFormProps) => {
  const { profile, saving, hasChanges, emailChanged, currentPassword, setCurrentPassword, updateProfile, save } = form;
  if (!profile) return null;
  return (
    <SettingsMutationForm data-form="profile" onSubmit={save} aria-busy={saving || reading} className="mt-5 space-y-4">
      <div className="settings-profile-fields">
        {PROFILE_FIELDS.map(({ field, label, type, required, maxLength, pattern, help }) => (
          <Fragment key={field}>
            <TextField id={`settings-${field}`} label={label} type={type as "text" | "email" | "tel"} name={field} required={required} disabled={saving} maxLength={maxLength} pattern={pattern} hint={help} value={profile[field] ?? ""} onChange={(event) => updateProfile(field, event.target.value)} />
            {field === "email" && emailChanged ? (
              <PasswordField id="settings-current_password" label={CURRENT_PASSWORD.label} name={CURRENT_PASSWORD.field} autoComplete="current-password" required disabled={saving} maxLength={CURRENT_PASSWORD.maxLength} hint={CURRENT_PASSWORD.help} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            ) : null}
          </Fragment>
        ))}
      </div>
      <SaveButton type="submit" label={saving ? "Enregistrement…" : "Enregistrer le profil"} loading={saving} disabled={saving || reading || !hasChanges} className="settings-primary-action" />
      {!hasChanges ? <Help>Aucune modification à enregistrer.</Help> : null}
    </SettingsMutationForm>
  );
};
