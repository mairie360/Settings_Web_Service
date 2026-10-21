"use client";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import { saveProfile } from "@/lib/settings-api";
import type { SettingsProfile as Profile } from "@/lib/settings-api";
import { isConfirmedProfile } from "@/lib/settings-bootstrap";
import { PASSWORD_REQUIRED_MESSAGE, isEmailChanged, profilePatch, saveErrorMessage } from "@/lib/profile-form";
import type { ProfileField } from "@/lib/profile-form";
import type { SettingsData } from "./use-settings-data";

export interface ProfileForm {
  profile: Profile | null;
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  error: string;
  errorDetails: string[];
  status: string;
  clearStatus: () => void;
  saving: boolean;
  hasChanges: boolean;
  emailChanged: boolean;
  updateProfile: (field: ProfileField, value: string) => void;
  clearSaveError: () => void;
  save: (event: FormEvent) => Promise<void>;
}

/** Draft edits of the profile, the e-mail confirmation password and the one PATCH /settings/profile. */
export function useProfileForm({ data, setData, profile, setProfile, readRef, savingRef, confirmedProfileRef, registerAccountChanged }: SettingsData): ProfileForm {
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  // Confirms an e-mail change (MAIR-511); never part of the profile state, cleared once used or no longer needed.
  const [currentPassword, setCurrentPassword] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    registerAccountChanged(() => { setCurrentPassword(""); setError(""); setErrorDetails([]); setStatus(""); });
  }, [registerAccountChanged]);

  const patch = data && profile ? profilePatch(data.profile, profile) : {};
  const hasChanges = Object.keys(patch).length > 0;
  const emailChanged = data && profile ? isEmailChanged(data.profile, profile) : false;
  const clearSaveError = useCallback(() => { setError(""); setErrorDetails([]); }, []);

  function updateProfile(field: ProfileField, value: string) {
    if (savingRef.current) return;
    setProfile((current) => current ? { ...current, [field]: value || (field === "phone" ? null : value) } : current);
    if (field === "email" && data && !isEmailChanged(data.profile, { ...data.profile, email: value })) setCurrentPassword("");
    clearSaveError();
    setStatus("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (savingRef.current || readRef.current || !profile || !data || !hasChanges) return;
    // The BFF only changes the e-mail with the current password: refuse locally instead of a round trip.
    const password = emailChanged ? currentPassword : "";
    if (emailChanged && !password) {
      setErrorDetails([]);
      setError(PASSWORD_REQUIRED_MESSAGE);
      setStatus("");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    clearSaveError();
    setStatus("");
    try {
      const saved = await saveProfile(password ? { ...patch, current_password: password } : patch);
      if (!isConfirmedProfile(saved)) {
        throw new Error("L’enregistrement du profil n’a pas été confirmé. Réessayez.");
      }
      confirmedProfileRef.current = saved;
      setProfile(saved);
      setData((current) => current ? { ...current, profile: saved } : current);
      setCurrentPassword("");
      setStatus("Votre profil a été enregistré.");
    } catch (reason) {
      const { message, details } = saveErrorMessage(reason, Boolean(password));
      setError(message);
      setErrorDetails(details);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return { profile, currentPassword, setCurrentPassword: (value) => { if (!savingRef.current) { setCurrentPassword(value); clearSaveError(); } }, error, errorDetails, status, clearStatus: () => setStatus(""), saving, hasChanges, emailChanged, updateProfile, clearSaveError, save };
}
