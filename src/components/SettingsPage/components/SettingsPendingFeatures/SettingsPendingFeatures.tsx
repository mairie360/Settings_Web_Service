"use client";
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { changedFields, pendingFeatureMessage, pendingSettingsPort } from '@/lib/settings-features';
import type { SettingsFeaturePort, SettingsPreferences } from '@/lib/settings-features';
import type { SettingsTabId } from '../SettingsTabs';
import { PasswordForm } from './components/PasswordForm';
import { DraftPreferences } from './components/DraftPreferences';
import { FailureToast, FeedbackToast } from '../FeedbackToast';

const initialPreferences: SettingsPreferences = {
  messages: true, projects: true, calendar: true, theme: 'system', fontFamily: 'system',
  fontSize: 17, density: 'normal', homePage: 'dashboard', autoOpenNotifications: false,
};

export interface SettingsPendingFeaturesProps {
  tab: SettingsTabId; port?: SettingsFeaturePort;
  preferencesContent?: ReactNode; profileContent?: ReactNode; securityContent?: ReactNode; sessionsContent?: ReactNode;
  initial?: SettingsPreferences;
}

/**
 * The tab contents that still go through the feature port (photo, professional draft, password,
 * draft preferences), composed with the confirmed contents the page passes in (profile, sessions, preferences).
 */
export default function SettingsPendingFeatures({ tab, port = pendingSettingsPort, initial, preferencesContent, profileContent, securityContent, sessionsContent }: SettingsPendingFeaturesProps) {
  const [preferences, setPreferences] = useState(initial ?? initialPreferences);
  const [confirmedPreferences, setConfirmedPreferences] = useState(initial ?? initialPreferences);
  const [feedback, setFeedback] = useState<Record<string, { message: string; failed: boolean }>>({});
  const [busy, setBusy] = useState('');
  const writing = useRef(false);
  const alive = useRef(true);
  const securityEpoch = useRef(0);
  const [passwordEpoch, setPasswordEpoch] = useState(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  // Passwords live only in memory and are cleared when leaving Security.
  useEffect(() => { if (tab !== 'security') { securityEpoch.current += 1; setPasswordEpoch(securityEpoch.current); setFeedback(current => Object.fromEntries(Object.entries(current).filter(([key]) => key !== 'password'))); } }, [tab]);

  async function perform(name: string, operation?: () => Promise<void>, success = 'Modification confirmée.') {
    if (writing.current) return;
    const epoch = securityEpoch.current;
    const securityOperation = name === 'password';
    const current = () => alive.current && (!securityOperation || epoch === securityEpoch.current);
    setFeedback(current => ({ ...current, [name]: { message: '', failed: false } }));
    if (!operation) { setFeedback(current => ({ ...current, [name]: { message: pendingFeatureMessage, failed: true } })); return; }
    writing.current = true; setBusy(name);
    try {
      await operation();
      if (current()) setFeedback(current => ({ ...current, [name]: { message: success, failed: false } }));
    } catch (reason) {
      if (current()) setFeedback(current => ({ ...current, [name]: { message: reason instanceof Error ? reason.message : 'La modification n’a pas été confirmée. Votre saisie est conservée.', failed: true } }));
    } finally { writing.current = false; if (alive.current) setBusy(''); }
  }
  function notice(name: string) {
    const value = feedback[name];
    const dismiss = () => setFeedback(current => ({ ...current, [name]: { message: '', failed: false } }));
    return <><FeedbackToast message={value && !value.failed ? value.message : ''} data-feedback={name} onClose={dismiss} />{value?.failed && value.message ? <FailureToast message={value.message} onClose={dismiss} /> : null}</>;
  }
  function update<K extends keyof SettingsPreferences>(key: K, value: SettingsPreferences[K]) { if (!writing.current) setPreferences(current => ({ ...current, [key]: value })); }
  function savePreferences() {
    const patch = changedFields(confirmedPreferences, preferences);
    void perform('preferences', port.savePreferences ? async () => {
      const next = await port.savePreferences!(patch);
      if (!next || Object.keys(preferences).some(key => typeof next[key as keyof SettingsPreferences] !== typeof preferences[key as keyof SettingsPreferences])) throw new Error('Les préférences enregistrées n’ont pas été confirmées.');
      if (alive.current) { setPreferences(next); setConfirmedPreferences(next); }
    } : undefined, 'Préférences enregistrées.');
  }

  return <div className="settings-feature-panels mt-5 space-y-5">
    {tab === 'profile' ? profileContent : null}
    {tab === 'security' ? <>
      <PasswordForm busy={Boolean(busy)} epoch={passwordEpoch}
        onInvalid={(message) => setFeedback(current => ({ ...current, password: { message, failed: true } }))}
        onSubmit={(currentPassword, next, done) => void perform('password', port.changePassword ? async () => { const epoch = securityEpoch.current; await port.changePassword!(currentPassword, next); if (alive.current && epoch === securityEpoch.current) done(); } : undefined, 'Mot de passe modifié.')}>
        {notice('password')}
      </PasswordForm>
      {securityContent}
    </> : null}
    {tab === 'sessions' ? sessionsContent : null}
    {preferencesContent ?? (['notifications', 'appearance', 'general'].includes(tab)
      ? <DraftPreferences tab={tab as 'notifications' | 'appearance' | 'general'} preferences={preferences} confirmed={confirmedPreferences} busy={Boolean(busy)} update={update} onSave={savePreferences}>{notice('preferences')}</DraftPreferences>
      : null)}
  </div>;
}
