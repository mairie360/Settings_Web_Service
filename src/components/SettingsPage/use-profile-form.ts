"use client";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import { saveProfile } from '../../lib/settings-api';
import type { SettingsProfile as Profile } from '../../lib/settings-api';
import { BffRequestError } from '../../lib/bff-client';
import { isConfirmedProfile } from '../../lib/settings-bootstrap';
import { PASSWORD_REQUIRED_MESSAGE, PROFILE_FIELDS, detailFieldErrors, isEmailChanged, profilePatch, saveErrorMessage, validateProfile } from '../../lib/profile-form';
import type { FieldErrors, ProfileField } from '../../lib/profile-form';
import type { SettingsData } from './use-settings-data';

/** A refused save, shown as a toast (MAIR-864): « Profil non enregistré » for fields to fix, « Enregistrement impossible » otherwise. */
export interface SaveFailure { title: string; message: string }

export interface ProfileForm {
  profile: Profile | null;
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  /** Errors shown under each field (local checks or the BFF's validation details). */
  fieldErrors: FieldErrors;
  failure: SaveFailure | null;
  clearFailure: () => void;
  status: string;
  clearStatus: () => void;
  saving: boolean;
  hasChanges: boolean;
  /** Number of fields that differ from the confirmed profile (« N champs modifiés. »). */
  changedCount: number;
  emailChanged: boolean;
  /** Id of the first field in error, focused after a refused save. */
  focusTarget: string;
  updateProfile: (field: ProfileField, value: string) => void;
  cancel: () => void;
  save: (event: FormEvent) => Promise<void>;
}

const FIX_FIELDS: SaveFailure = { title: 'Profil non enregistré', message: 'Corrigez les champs signalés.' };
const fieldOrder = [...PROFILE_FIELDS.map(({ field }) => field as string), 'current_password'];
const firstInError = (errors: FieldErrors) => fieldOrder.find((field) => errors[field as keyof FieldErrors]) ?? '';

/** Draft edits of the profile, the e-mail confirmation password and the one PATCH /settings/profile (MAIR-864). */
export function useProfileForm({ data, setData, profile, setProfile, readRef, savingRef, confirmedProfileRef, registerAccountChanged }: SettingsData): ProfileForm {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<SaveFailure | null>(null);
  // Confirms an e-mail change (MAIR-511); never part of the profile state, cleared once used or no longer needed.
  const [currentPassword, setCurrentPassword] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [focusTarget, setFocusTarget] = useState("");
  useEffect(() => {
    registerAccountChanged(() => { setCurrentPassword(""); setFieldErrors({}); setFailure(null); setStatus(""); });
  }, [registerAccountChanged]);

  const patch = data && profile ? profilePatch(data.profile, profile) : {};
  const changedCount = Object.keys(patch).length;
  const hasChanges = changedCount > 0;
  const emailChanged = data && profile ? isEmailChanged(data.profile, profile) : false;
  const clearFieldError = useCallback((field: keyof FieldErrors) => setFieldErrors((current) => {
    if (!current[field]) return current;
    const next = { ...current }; delete next[field]; return next;
  }), []);

  function refuse(errors: FieldErrors, toast: SaveFailure) {
    setFieldErrors(errors);
    setFailure(toast);
    setFocusTarget(firstInError(errors));
  }

  function updateProfile(field: ProfileField, value: string) {
    if (savingRef.current) return;
    setProfile((current) => current ? { ...current, [field]: value || (field === "phone" ? null : value) } : current);
    if (field === "email" && data && !isEmailChanged(data.profile, { ...data.profile, email: value })) { setCurrentPassword(""); clearFieldError("current_password"); }
    clearFieldError(field);
    setStatus("");
  }

  function cancel() {
    if (savingRef.current || !data) return;
    setProfile(data.profile);
    setCurrentPassword("");
    setFieldErrors({});
    setFocusTarget("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (savingRef.current || readRef.current || !profile || !data || !hasChanges) return;
    const local = validateProfile(profile);
    // The BFF only changes the e-mail with the current password: refuse locally instead of a round trip.
    const password = emailChanged ? currentPassword : "";
    if (emailChanged && !password) local.current_password = PASSWORD_REQUIRED_MESSAGE;
    if (Object.keys(local).length) { refuse(local, FIX_FIELDS); setStatus(""); return; }
    savingRef.current = true;
    setSaving(true);
    setFieldErrors({});
    setFailure(null);
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
      const { message } = saveErrorMessage(reason, Boolean(password));
      const fields = reason instanceof BffRequestError
        ? reason.status === 403 && password ? { current_password: message }
          : reason.status === 409 ? { email: message }
            : reason.status === 400 ? detailFieldErrors(reason.details) : {}
        : {};
      if (Object.keys(fields).length) refuse(fields, FIX_FIELDS);
      else refuse({}, { title: 'Enregistrement impossible', message });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return {
    profile, currentPassword,
    setCurrentPassword: (value) => { if (!savingRef.current) { setCurrentPassword(value); clearFieldError("current_password"); } },
    fieldErrors, failure, clearFailure: () => setFailure(null), status, clearStatus: () => setStatus(""),
    saving, hasChanges, changedCount, emailChanged, focusTarget, updateProfile, cancel, save,
  };
}
