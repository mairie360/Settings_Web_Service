"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { loadProfilePhoto, removeProfilePhoto, saveProfile, saveProfilePhoto } from '../../lib/settings-api';
import { toProfilePhoto } from '../../lib/profile-photo';
import type { SettingsProfile as Profile } from '../../lib/settings-api';
import { BffRequestError } from '../../lib/bff-client';
import { isConfirmedProfile } from '../../lib/settings-bootstrap';
import { CLEARABLE_FIELDS, PASSWORD_REQUIRED_MESSAGE, PROFILE_FIELDS, detailFieldErrors, isEmailChanged, profilePatch, saveErrorMessage, validateProfile } from '../../lib/profile-form';
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
  /** URL of the photo shown (the draft one, else the stored one), `null` for the initials. */
  photoUrl: string | null;
  /** URL of the stored photo only (the account band shows the saved identity), `null` for the initials. */
  storedPhotoUrl: string | null;
  /** Refusal of the picked image (unreadable, too heavy once compressed), shown under the photo field. */
  photoError: string | null;
  /** A picked file (converted to WebP 256 × 256 before it is kept) or `null` for « Retirer ». */
  choosePhoto: (file: File | null) => Promise<void>;
  cancel: () => void;
  save: (event: FormEvent) => Promise<void>;
}

const PHOTO_TOO_LARGE = 'Cette photo dépasse 100 Ko une fois compressée.';
const PHOTO_REFUSED = 'Cette photo n’a pas été acceptée. Choisissez un fichier JPG ou PNG.';
const FIX_FIELDS: SaveFailure = { title: 'Profil non enregistré', message: 'Corrigez les champs signalés.' };
const fieldOrder = ['photo', ...PROFILE_FIELDS.map(({ field }) => field as string), 'current_password'];

/** Photo change waiting for « Enregistrer »: a converted WebP, or its removal. */
type PhotoDraft = { kind: 'set'; blob: Blob; url: string } | { kind: 'remove' } | null;
const objectUrl = (blob: Blob) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(blob) : '');
const revoke = (url: string | null | undefined) => { if (url && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url); };
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
  const [photoDraft, setPhotoDraft] = useState<PhotoDraft>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [storedPhoto, setStoredPhoto] = useState<string | null>(null);
  const draftUrl = useRef<string | null>(null);
  // Bumped by every pick, « Annuler », save and account change: a conversion that ends after one of them is dropped.
  const photoPick = useRef(0);
  const hasPhoto = Boolean(data?.profile.has_photo);
  // The stored photo is read once the confirmed profile says there is one, again after each photo save and for
  // another account (its photo is never shown on the next one's form).
  const [photoVersion, setPhotoVersion] = useState(0);
  useEffect(() => {
    if (!hasPhoto) return;
    const controller = new AbortController();
    let url: string | null = null;
    loadProfilePhoto(controller.signal).then((blob) => {
      if (controller.signal.aborted) return;
      url = blob ? objectUrl(blob) : null;
      setStoredPhoto(url);
    }).catch(() => { if (!controller.signal.aborted) setStoredPhoto(null); });
    // The previous photo goes away with the load that showed it.
    return () => { controller.abort(); revoke(url); setStoredPhoto(null); };
  }, [hasPhoto, photoVersion]);
  useEffect(() => () => revoke(draftUrl.current), []);
  useEffect(() => {
    registerAccountChanged(() => {
      setCurrentPassword(""); setFieldErrors({}); setFailure(null); setStatus("");
      photoPick.current += 1;
      replaceDraft(null); setPhotoError(null); setPhotoVersion((version) => version + 1);
    });
  }, [registerAccountChanged]);

  const patch = data && profile ? profilePatch(data.profile, profile) : {};
  const photoChanged = photoDraft !== null && !(photoDraft.kind === 'remove' && !hasPhoto);
  const changedCount = Object.keys(patch).length + (photoChanged ? 1 : 0);
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
    setProfile((current) => current ? { ...current, [field]: value || (CLEARABLE_FIELDS.includes(field) ? null : value) } : current);
    if (field === "email" && data && !isEmailChanged(data.profile, { ...data.profile, email: value })) { setCurrentPassword(""); clearFieldError("current_password"); }
    clearFieldError(field);
    setStatus("");
  }

  function replaceDraft(next: PhotoDraft) {
    revoke(draftUrl.current);
    draftUrl.current = next?.kind === 'set' ? next.url : null;
    setPhotoDraft(next);
  }

  async function choosePhoto(file: File | null) {
    if (savingRef.current) return;
    setPhotoError(null);
    setStatus("");
    const pick = ++photoPick.current;
    if (!file) { replaceDraft({ kind: 'remove' }); return; }
    try {
      const blob = await toProfilePhoto(file);
      if (pick === photoPick.current) replaceDraft({ kind: 'set', blob, url: objectUrl(blob) });
    } catch (reason) {
      if (pick === photoPick.current) setPhotoError(reason instanceof Error ? reason.message : String(reason));
    }
  }

  function confirm(saved: Profile) {
    confirmedProfileRef.current = saved;
    setProfile(saved);
    setData((current) => current ? { ...current, profile: saved } : current);
    setCurrentPassword("");
  }

  function cancel() {
    if (savingRef.current || !data) return;
    photoPick.current += 1;
    replaceDraft(null);
    setPhotoError(null);
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
    // A conversion still running is not part of this save.
    photoPick.current += 1;
    if (photoChanged) setPhotoError(null);
    let saved = data.profile;
    try {
      if (Object.keys(patch).length) {
        saved = await saveProfile(password ? { ...patch, current_password: password } : patch);
        if (!isConfirmedProfile(saved)) {
          throw new Error("L’enregistrement du profil n’a pas été confirmé. Réessayez.");
        }
        confirm(saved);
      }
    } catch (reason) {
      const { message } = saveErrorMessage(reason, Boolean(password));
      const fields = reason instanceof BffRequestError
        ? reason.status === 403 && password ? { current_password: message }
          : reason.status === 409 ? { email: message }
            : reason.status === 400 ? detailFieldErrors(reason.details) : {}
        : {};
      if (Object.keys(fields).length) refuse(fields, FIX_FIELDS);
      else refuse({}, { title: 'Enregistrement impossible', message });
      savingRef.current = false;
      setSaving(false);
      return;
    }
    // The photo goes after the fields: a refused photo leaves the saved fields confirmed and keeps its draft.
    try {
      if (photoChanged && photoDraft) {
        if (photoDraft.kind === 'set') await saveProfilePhoto(photoDraft.blob);
        else await removeProfilePhoto();
        saved = { ...saved, has_photo: photoDraft.kind === 'set' };
        confirm(saved);
        replaceDraft(null);
        setPhotoVersion((version) => version + 1);
      }
      setStatus("Votre profil a été enregistré.");
    } catch (reason) {
      const message = reason instanceof BffRequestError && reason.status === 413 ? PHOTO_TOO_LARGE
        : reason instanceof BffRequestError && reason.status === 400 ? PHOTO_REFUSED
          : saveErrorMessage(reason, false).message;
      setPhotoError(message);
      refuse({}, { title: 'Photo non enregistrée', message });
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
    photoUrl: photoDraft?.kind === 'set' ? photoDraft.url : photoDraft?.kind === 'remove' ? null : storedPhoto,
    storedPhotoUrl: storedPhoto,
    photoError, choosePhoto,
  };
}
