"use client";
import { useCallback, useEffect, useRef, useState } from "react";

import { loadSettings } from "@/lib/settings-api";
import type { SettingsProfile as Profile } from "@/lib/settings-api";
import { isConfirmedBootstrap } from "@/lib/settings-bootstrap";
import type { SettingsBootstrapRead as Bootstrap } from "@/lib/settings-bootstrap";
import { subscribePageReturn } from "@/lib/page-return";
import { profilePatch } from "@/lib/profile-form";

export interface SettingsData {
  data: Bootstrap | null;
  setData: React.Dispatch<React.SetStateAction<Bootstrap | null>>;
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  reading: boolean;
  readError: string;
  readAnnouncement: string;
  /** Increments when a foreground read lands on another account: preference drafts restart. */
  accountScope: number;
  /** Guard refs shared with the profile form and the preference panels. */
  readRef: React.MutableRefObject<AbortController | null>;
  savingRef: React.MutableRefObject<boolean>;
  preferencesWriting: React.MutableRefObject<boolean>;
  confirmedProfileRef: React.MutableRefObject<Profile | null>;
  readSettings: (fromForeground?: boolean) => Promise<void>;
  /** Explicit recovery read from the notices button. */
  reload: () => void;
  /** The preference panels report an in-flight write so a page-return read waits. */
  setPreferencesWriting: (writing: boolean) => void;
  /** The profile form registers what to clear when a foreground read lands on another account. */
  registerAccountChanged: (listener: () => void) => void;
}

/**
 * Reads /settings/bootstrap once (unless a confirmed server bootstrap was given) and on page
 * return; merges a confirmed read into the draft profile; a failed read keeps the last data.
 */
export function useSettingsData(initialData?: Bootstrap | null): SettingsData {
  const [initial] = useState(() => isConfirmedBootstrap(initialData) ? initialData : null);
  const [data, setData] = useState<Bootstrap | null>(initial);
  const [profile, setProfile] = useState<Profile | null>(initial?.profile ?? null);
  const [reading, setReading] = useState(!initial);
  const [readError, setReadError] = useState("");
  const [readAnnouncement, setReadAnnouncement] = useState("");
  const [accountScope, setAccountScope] = useState(0);
  const readRef = useRef<AbortController | null>(null);
  const savingRef = useRef(false);
  const preferencesWriting = useRef(false);
  const confirmedProfileRef = useRef<Profile | null>(initial?.profile ?? null);
  const onAccountChanged = useRef<() => void>(() => undefined);

  const readSettings = useCallback(async (fromForeground = false) => {
    if (readRef.current || savingRef.current || preferencesWriting.current) return;
    const controller = new AbortController();
    const baseline = confirmedProfileRef.current;
    readRef.current = controller;
    setReading(true);
    setReadAnnouncement("Chargement des paramètres…");
    try {
      const result = await loadSettings(controller.signal);
      if (controller.signal.aborted || readRef.current !== controller) return;
      if (!isConfirmedBootstrap(result)) {
        throw new Error("Les paramètres reçus sont incohérents. Réessayez.");
      }
      const preferencesScopeChanged = baseline && baseline.email !== result.profile.email;
      const profileScopeChanged = fromForeground && preferencesScopeChanged;
      if (preferencesScopeChanged) setAccountScope(scope => scope + 1);
      if (profileScopeChanged) onAccountChanged.current();
      confirmedProfileRef.current = result.profile;
      setData(result);
      // Merge against the previous confirmed profile, including edits made during the read.
      setProfile((current) => baseline && current && !profileScopeChanged
        ? { ...result.profile, ...profilePatch(baseline, current) }
        : result.profile);
      setReadError("");
    } catch (reason) {
      if (!controller.signal.aborted && readRef.current === controller) {
        setReadError(reason instanceof Error ? reason.message : "Les paramètres n’ont pas pu être chargés.");
      }
    } finally {
      if (readRef.current === controller) {
        readRef.current = null;
        setReading(false);
        setReadAnnouncement("");
      }
    }
  }, []);

  useEffect(() => {
    if (!initial) void readSettings();
    return () => {
      readRef.current?.abort();
      readRef.current = null;
    };
  }, [readSettings, initial]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const page = document;
    const refresh = () => { if (!page.hidden) void readSettings(true); };
    return subscribePageReturn(refresh);
  }, [readSettings]);

  const setPreferencesWriting = useCallback((writing: boolean) => { preferencesWriting.current = writing; }, []);
  const registerAccountChanged = useCallback((listener: () => void) => { onAccountChanged.current = listener; }, []);
  const reload = useCallback(() => {
    if (readRef.current || savingRef.current || preferencesWriting.current) return;
    setReading(true);
    void readSettings();
  }, [readSettings]);

  return { data, setData, profile, setProfile, reading, readError, readAnnouncement, accountScope, readRef, savingRef, preferencesWriting, confirmedProfileRef, readSettings, reload, setPreferencesWriting, registerAccountChanged };
}
