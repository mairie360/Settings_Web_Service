"use client";
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Help, SectionTitle } from '@mairie360/lib-components/primitives';

import { changedFields, pendingFeatureMessage, pendingSettingsPort } from '@/lib/settings-features';
import type { ExtendedProfile, SettingsFeaturePort, SettingsPreferences } from '@/lib/settings-features';
import type { SettingsTabId } from '../SettingsTabs';
import { ProfilePhoto } from './components/ProfilePhoto';
import { ProfessionalDraft } from './components/ProfessionalDraft';
import { PasswordForm } from './components/PasswordForm';
import { TwoFactorSection } from './components/TwoFactorSection';
import { DraftPreferences } from './components/DraftPreferences';
import InstanceUpdatesPanel from './components/InstanceUpdatesPanel';
import { FailureToast, FeedbackToast } from '../FeedbackToast';

const initialPreferences: SettingsPreferences = {
  messages: true, projects: true, calendar: true, theme: 'system', fontFamily: 'system',
  fontSize: 17, density: 'normal', homePage: 'dashboard', autoOpenNotifications: false,
};
const emptyProfile: ExtendedProfile = { service: '', position: '', biography: '' };

export interface SettingsPendingFeaturesProps {
  tab: SettingsTabId; isAdmin: boolean; port?: SettingsFeaturePort;
  /** Keycloak account console, where the second factor is managed (MAIR-357); absent without Keycloak. */
  twoFactorUrl?: string;
  profileInitials?: string;
  preferencesContent?: ReactNode; profileContent?: ReactNode; securityContent?: ReactNode; systemContent?: ReactNode;
  initial?: SettingsPreferences; extendedProfile?: ExtendedProfile;
}

/**
 * The tab contents that still go through the feature port (photo, professional draft, password,
 * two-factor, draft preferences, instance updates), composed with the confirmed contents the page passes in.
 */
export default function SettingsPendingFeatures({ tab, isAdmin, port = pendingSettingsPort, initial, extendedProfile, preferencesContent, profileContent, securityContent, systemContent, profileInitials = '?', twoFactorUrl }: SettingsPendingFeaturesProps) {
  const [preferences, setPreferences] = useState(initial ?? initialPreferences);
  const [confirmedPreferences, setConfirmedPreferences] = useState(initial ?? initialPreferences);
  const [profile, setProfile] = useState(extendedProfile ?? emptyProfile);
  const [confirmedProfile, setConfirmedProfile] = useState(extendedProfile ?? emptyProfile);
  const [confirmedPhoto, setConfirmedPhoto] = useState('');
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
    {tab === 'profile' ? <section className="settings-feature-card settings-account-card">
      <SectionTitle>Informations personnelles</SectionTitle>
      <Help className="settings-section-description">Ces informations sont utilisées pour votre compte Mairie360.</Help>
      <ProfilePhoto initials={profileInitials} busy={Boolean(busy)} confirmedPhoto={confirmedPhoto}
        onInvalid={(message) => setFeedback(current => ({ ...current, photo: { message, failed: true } }))}
        onPreview={() => setFeedback(current => ({ ...current, photo: { message: 'Aperçu local uniquement. La photo du compte reste inchangée.', failed: false } }))}
        onSave={(photo) => void perform('photo', port.savePhoto ? async () => {
          const url = await port.savePhoto!(photo); if (!url || !/^https?:\/\//.test(url)) throw new Error('La photo enregistrée n’a pas été confirmée.');
          if (alive.current) setConfirmedPhoto(url);
        } : undefined, 'Photo enregistrée.')} />
      {notice('photo')}
      {profileContent}
    </section> : null}
    {tab === 'profile' ? <ProfessionalDraft profile={profile} confirmedProfile={confirmedProfile} busy={Boolean(busy)} onChange={setProfile} onSubmit={() => void perform('extendedProfile', port.saveExtendedProfile ? async () => {
      const next = await port.saveExtendedProfile!(changedFields(confirmedProfile, profile));
      if (!next || ['service', 'position', 'biography'].some(key => typeof next[key as keyof ExtendedProfile] !== 'string')) throw new Error('Le profil complémentaire n’a pas été confirmé.');
      if (alive.current) { setProfile(next); setConfirmedProfile(next); }
    } : undefined, 'Informations complémentaires enregistrées.')}>{notice('extendedProfile')}</ProfessionalDraft> : null}
    {tab === 'security' ? <>
      <PasswordForm busy={Boolean(busy)} epoch={passwordEpoch}
        onInvalid={(message) => setFeedback(current => ({ ...current, password: { message, failed: true } }))}
        onSubmit={(currentPassword, next, done) => void perform('password', port.changePassword ? async () => { const epoch = securityEpoch.current; await port.changePassword!(currentPassword, next); if (alive.current && epoch === securityEpoch.current) done(); } : undefined, 'Mot de passe modifié.')}>
        {notice('password')}
      </PasswordForm>
      <TwoFactorSection twoFactorUrl={twoFactorUrl} />
      {securityContent}
    </> : null}
    {preferencesContent ?? (['notifications', 'appearance', 'general'].includes(tab)
      ? <DraftPreferences tab={tab as 'notifications' | 'appearance' | 'general'} preferences={preferences} confirmed={confirmedPreferences} busy={Boolean(busy)} update={update} onSave={savePreferences}>{notice('preferences')}</DraftPreferences>
      : null)}
    {tab === 'system' ? <>{isAdmin ? <InstanceUpdatesPanel port={port} /> : null}{systemContent}</> : null}
  </div>;
}
