"use client";

import SettingsMutationForm from '@/components/settings-mutation-form';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BriefcaseBusiness } from "lucide-react";
import { Avatar, Toast } from '@mairie360/lib-components/primitives';
type SettingsTabId = 'profile' | 'security' | 'notifications' | 'appearance' | 'general' | 'system';
import { changedFields, pendingFeatureMessage, pendingSettingsPort, validatePassword, validatePhoto } from '@/lib/settings-features';
import type { ExtendedProfile, InstanceUpdates, SettingsFeaturePort, SettingsPreferences } from '@/lib/settings-features';

const initialPreferences: SettingsPreferences = {
  messages: true, projects: true, calendar: true, theme: 'system', fontFamily: 'system',
  fontSize: 17, density: 'normal', homePage: 'dashboard', autoOpenNotifications: false,
};
const emptyProfile: ExtendedProfile = { service: '', position: '', biography: '' };
const fieldClass = 'mt-1 w-full rounded border border-[#cbd5e1] bg-white px-3 py-2 text-[#172033]';
const buttonClass = 'rounded border border-[#cbd5e1] bg-white px-4 py-2 text-[#172033] disabled:opacity-50';

export default function SettingsPendingFeatures({ tab, isAdmin, port = pendingSettingsPort, initial, extendedProfile, preferencesContent, profileContent, securityContent, systemContent, profileInitials = '?', twoFactorUrl }: {
  tab: SettingsTabId; isAdmin: boolean; port?: SettingsFeaturePort;
  /** Keycloak account console, where the second factor is managed (MAIR-357); absent without Keycloak. */
  twoFactorUrl?: string;
  profileInitials?: string;
  preferencesContent?: ReactNode; profileContent?: ReactNode; securityContent?: ReactNode; systemContent?: ReactNode;
  initial?: SettingsPreferences; extendedProfile?: ExtendedProfile;
}) {
  const [preferences, setPreferences] = useState(initial ?? initialPreferences);
  const [confirmedPreferences, setConfirmedPreferences] = useState(initial ?? initialPreferences);
  const [profile, setProfile] = useState(extendedProfile ?? emptyProfile);
  const [confirmedProfile, setConfirmedProfile] = useState(extendedProfile ?? emptyProfile);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [confirmedPhoto, setConfirmedPhoto] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirmation: '' });
  const [feedback, setFeedback] = useState<Record<string, { message: string; failed: boolean }>>({});
  const [busy, setBusy] = useState('');
  const writing = useRef(false);
  const alive = useRef(true);
  const securityEpoch = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!photo) { setPhotoPreview(confirmedPhoto); return; }
    const url = URL.createObjectURL(photo); setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo,confirmedPhoto]);
  // Passwords live only in memory and are cleared when leaving Security.
  useEffect(() => { if (tab !== 'security') { securityEpoch.current += 1; setPasswords({ current: '', next: '', confirmation: '' }); setFeedback(current => Object.fromEntries(Object.entries(current).filter(([key]) => key !== 'password'))); } }, [tab]);

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
    return <><Toast message={value && !value.failed ? value.message : ''} variant="success" data-feedback={name} className={value?.message && !value.failed ? 'mt-3' : 'sr-only'} onClose={value?.message && !value.failed ? dismiss : undefined} />{value?.failed && value.message ? <Toast message={value.message} variant="error" className="mt-3" onClose={dismiss} /> : null}</>;
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
    {tab === 'profile' ? <section className="settings-feature-card settings-account-card"><h2>Informations personnelles</h2><p className="settings-section-description">Ces informations sont utilisées pour votre compte Mairie360.</p>
      <section className="settings-photo-row" aria-labelledby="settings-photo-title">
        <Avatar className="settings-photo-avatar" src={photoPreview || undefined} alt="Aperçu de la photo sélectionnée" fallback={profileInitials} />
        <div className="settings-photo-controls"><h3 id="settings-photo-title">Photo du profil</h3>
        <div className="settings-file-selection"><label className="settings-file-picker">Changer la photo<input type="file" accept="image/jpeg,image/png" disabled={Boolean(busy)} className="sr-only" aria-describedby="settings-photo-help" onChange={event => {
          const file = event.target.files?.[0]; if (!file) return;
          const error = validatePhoto(file);
          if (error) { setFeedback(current => ({ ...current, photo: { message: error, failed: true } })); event.target.value = ''; return; }
          setPhoto(file); setFeedback(current => ({ ...current, photo: { message: 'Aperçu local uniquement. La photo du compte reste inchangée.', failed: false } }));
        }} /></label><span className="settings-file-name">{photo?.name ?? 'Aucun fichier choisi'}</span></div><p id="settings-photo-help" className="text-sm">JPG ou PNG, 2 Mo maximum.</p>
        {photo ? <button type="button" className={buttonClass} disabled={!photo || Boolean(busy)} onClick={() => void perform('photo', port.savePhoto && photo ? async () => {
          const url = await port.savePhoto!(photo); if (!url || !/^https?:\/\//.test(url)) throw new Error('La photo enregistrée n’a pas été confirmée.');
          if (alive.current) { setConfirmedPhoto(url); setPhoto(null); }
        } : undefined, 'Photo enregistrée.')}>Enregistrer la photo</button> : null}
        {photo ? <button type="button" className={`${buttonClass} ml-2`} disabled={Boolean(busy)} onClick={() => setPhoto(null)}>Retirer l’aperçu</button> : null}{notice('photo')}</div>
      </section>
      {profileContent}
    </section> : null}
    {tab === 'profile' ? <section className="settings-feature-card settings-professional-card"><details><summary><h2 className="settings-professional-heading"><BriefcaseBusiness aria-hidden="true" size={24} />Informations professionnelles<span className="settings-draft-badge">Brouillon local</span></h2><span className="settings-section-description">Ces informations ne sont pas encore enregistrables dans votre compte.</span></summary>
      <SettingsMutationForm className="mt-5" onSubmit={event => { event.preventDefault(); void perform('extendedProfile', port.saveExtendedProfile ? async () => {
        const next = await port.saveExtendedProfile!(changedFields(confirmedProfile, profile));
        if (!next || ['service', 'position', 'biography'].some(key => typeof next[key as keyof ExtendedProfile] !== 'string')) throw new Error('Le profil complémentaire n’a pas été confirmé.');
        if (alive.current) { setProfile(next); setConfirmedProfile(next); }
      } : undefined, 'Informations complémentaires enregistrées.'); }}>
        <p className="text-sm">Brouillon conservé uniquement pendant cette visite.</p>
        <div className="settings-profile-fields">{[['service','Service'],['position','Poste']].map(([key,label]) => <label key={key}>{label}<input className={fieldClass} value={profile[key as keyof ExtendedProfile]} disabled={Boolean(busy)} maxLength={200} onChange={event => setProfile(current => ({ ...current, [key]: event.target.value }))} /></label>)}</div>
        <label className="mt-4 block">Biographie<textarea className={fieldClass} rows={4} maxLength={5000} disabled={Boolean(busy)} value={profile.biography} onChange={event => setProfile(current => ({ ...current, biography: event.target.value }))} /></label>
        <button type="submit" className={buttonClass} disabled={Boolean(busy) || !Object.keys(changedFields(confirmedProfile,profile)).length}>Enregistrer les informations professionnelles</button>{notice('extendedProfile')}
      </SettingsMutationForm></details>
    </section> : null}
    {tab === 'security' ? <>
      <SettingsMutationForm className="settings-feature-card" onSubmit={event => {
        event.preventDefault(); const error = validatePassword(passwords.current,passwords.next,passwords.confirmation);
        if (error) { setFeedback(current => ({ ...current, password: { message: error, failed: true } })); return; }
        void perform('password', port.changePassword ? async () => { const epoch = securityEpoch.current; await port.changePassword!(passwords.current,passwords.next); if (alive.current && epoch === securityEpoch.current) setPasswords({ current: '',next: '',confirmation: '' }); } : undefined, 'Mot de passe modifié.');
      }}><h2>Mot de passe</h2><div className="mt-4 space-y-3">{[['current','Mot de passe actuel'],['next','Nouveau mot de passe'],['confirmation','Confirmer le mot de passe']].map(([key,label]) => <label className="block" key={key}>{label}<input type="password" required autoComplete={key === 'current' ? 'current-password' : 'new-password'} className={fieldClass} disabled={Boolean(busy)} value={passwords[key as keyof typeof passwords]} onChange={event => setPasswords(current => ({ ...current, [key]: event.target.value }))} /></label>)}</div><button type="submit" className={`${buttonClass} mt-4`} disabled={Boolean(busy)}>Changer le mot de passe</button>{notice('password')}</SettingsMutationForm>
      <section className="settings-feature-card" aria-labelledby="settings-two-factor-title"><h2 id="settings-two-factor-title">Double authentification</h2>
        {twoFactorUrl ? <><p className="settings-section-description">Protégez votre compte avec un code généré par une application d’authentification ou avec une clé de sécurité. Ce réglage se gère dans votre compte unique ; le code vous sera ensuite demandé à chaque connexion avec le compte unique.</p>
          <a className={`${buttonClass} mt-3 inline-block`} href={twoFactorUrl}>Gérer ma double authentification</a></>
          : <p className="settings-section-description">La double authentification n’est pas disponible sur cette instance.</p>}
      </section>
      {securityContent}
    </> : null}
    {preferencesContent ?? (['notifications','appearance','general'].includes(tab) ? <section className="settings-feature-card"><h2>{tab === 'notifications' ? 'Préférences de notification' : tab === 'appearance' ? 'Apparence' : 'Préférences générales'}</h2><p className="text-sm">Vos choix restent un brouillon pendant cette visite. Ils ne sont pas encore synchronisés avec votre compte.</p>
      {tab === 'notifications' ? <div className="mt-4 space-y-3">{[['messages','Messages'],['projects','Projets'],['calendar','Calendrier']].map(([key,label]) => <label key={key} className="flex items-center gap-3"><input type="checkbox" disabled={Boolean(busy)} checked={preferences[key as 'messages']} onChange={event => update(key as 'messages', event.target.checked)} />{label}</label>)}</div> : tab === 'appearance' ? <>
        <fieldset className="mt-4"><legend>Thème</legend><div className="flex flex-wrap gap-4">{[['light','Clair'],['dark','Sombre'],['system','Système']].map(([value,label]) => <label key={value}><input type="radio" name="settings-theme" disabled={Boolean(busy)} value={value} checked={preferences.theme === value} onChange={() => update('theme',value as SettingsPreferences['theme'])} /> {label}</label>)}</div></fieldset>
        <label className="mt-4 block">Police de caractères<select className={fieldClass} value={preferences.fontFamily} disabled={Boolean(busy)} onChange={event => update('fontFamily',event.target.value as SettingsPreferences['fontFamily'])}><option value="system">Police système</option><option value="sans">Sans serif</option><option value="serif">Serif</option></select></label>
        <label className="mt-4 block">Taille de police : {preferences.fontSize} px<input className="w-full" type="range" min={14} max={24} value={preferences.fontSize} disabled={Boolean(busy)} onChange={event => update('fontSize',Number(event.target.value))} /></label>
        <label className="mt-4 block">Compacité de l’interface<select className={fieldClass} value={preferences.density} disabled={Boolean(busy)} onChange={event => update('density',event.target.value as SettingsPreferences['density'])}><option value="compact">Compacte</option><option value="normal">Normale</option><option value="comfortable">Confortable</option></select></label>
        <div aria-label="Aperçu de l’apparence" className="mt-4 rounded border" style={{ background: preferences.theme === 'dark' ? '#172033' : '#fff', color: preferences.theme === 'dark' ? '#fff' : '#172033', fontFamily: preferences.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif', fontSize: preferences.fontSize, padding: preferences.density === 'compact' ? 8 : preferences.density === 'comfortable' ? 24 : 16 }}><strong>Aperçu</strong><p>Votre environnement Mairie360</p></div>
      </> : <><label className="mt-4 block">Page d’accueil par défaut<select className={fieldClass} disabled={Boolean(busy)} value={preferences.homePage} onChange={event => update('homePage',event.target.value as SettingsPreferences['homePage'])}>{[['dashboard','Tableau de bord'],['projects','Projets'],['calendar','Calendrier'],['messages','Messagerie']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="mt-4 flex items-center gap-3"><input type="checkbox" checked={preferences.autoOpenNotifications} disabled={Boolean(busy)} onChange={event => update('autoOpenNotifications',event.target.checked)} />Ouverture automatique des notifications</label></>}
      <button type="button" className={`${buttonClass} mt-5`} disabled={Boolean(busy) || !Object.keys(changedFields(confirmedPreferences,preferences)).length} onClick={savePreferences}>Enregistrer les préférences</button>{notice('preferences')}
    </section> : null)}
    {tab === 'system' ? <>{isAdmin ? <InstanceUpdatesPanel port={port} /> : null}{systemContent}</> : null}
  </div>;
}

function InstanceUpdatesPanel({ port }: { port: SettingsFeaturePort }) {
  const [data, setData] = useState<InstanceUpdates | null>(null);
  const [policy, setPolicy] = useState<'automatic' | 'pinned'>('automatic');
  const [version, setVersion] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const alive = useRef(true);
  const [revision,setRevision] = useState(0);
  const [reading,setReading] = useState(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; },[]);
  useEffect(() => {
    if (!port.loadUpdates) return;
    const controller = new AbortController(); setReading(true); setError('');
    void port.loadUpdates(controller.signal).then(next => {
      if (controller.signal.aborted) return;
      if (!next?.currentVersion || !next.maintenanceWindow || !Array.isArray(next.releases)) throw new Error('Les informations de mise à jour sont incohérentes.');
      setData(next); setPolicy(next.policy); setVersion(next.pinnedVersion ?? '');
    }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Lecture impossible.'); }).finally(() => { if (!controller.signal.aborted) setReading(false); });
    return () => controller.abort();
  }, [port,revision]);
  return <section className="settings-feature-card"><h2>Mises à jour de l’instance</h2>{!data ? <p>La version, la fenêtre de maintenance et les versions disponibles ne sont pas encore fournies.</p> : <><p>Version actuelle : {data.currentVersion}</p><p>Fenêtre de maintenance : {data.maintenanceWindow}</p>{data.policy === 'pinned' && data.releases.some(release => release.version === data.pinnedVersion && !release.supported) ? <p role="alert">La version épinglée n’est plus supportée. Choisissez une version prise en charge.</p> : null}<ul>{data.releases.map(release => <li className="mt-3 whitespace-pre-wrap" key={release.version}><strong>{release.version}</strong><p>{release.notes}</p></li>)}</ul></>}
    {port.loadUpdates ? <button type="button" className={buttonClass} disabled={reading || busy} onClick={() => setRevision(value => value + 1)}>{reading ? 'Chargement des versions…' : 'Actualiser les versions'}</button> : null}
    <SettingsMutationForm className="mt-4 space-y-3" onSubmit={async event => {
      event.preventDefault(); if (pending.current || reading) return; setError(''); setStatus('');
      if (!data || !port.saveUpdates) { setError(pendingFeatureMessage); return; }
      pending.current = true; setBusy(true);
      try { const next = await port.saveUpdates({ policy,...(policy === 'pinned' ? { version } : {}) }); if (!alive.current) return; if (!next?.currentVersion || !next.maintenanceWindow) throw new Error('La demande n’a pas été confirmée.'); setData(next); setPolicy(next.policy); setVersion(next.pinnedVersion ?? ''); setStatus('Demande confirmée pour la prochaine fenêtre de maintenance.'); }
      catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : 'La demande n’a pas pu être enregistrée.'); }
      finally { pending.current = false; if (alive.current) setBusy(false); }
    }}><label className="block">Politique de mise à jour<select className={fieldClass} value={policy} disabled={busy || reading} onChange={event => setPolicy(event.target.value as typeof policy)}><option value="automatic">Automatique</option><option value="pinned">Version épinglée</option></select></label>
      {policy === 'pinned' ? <label className="block">Version à épingler<select className={fieldClass} value={version} disabled={busy || reading || !data} required onChange={event => setVersion(event.target.value)}><option value="">Sélectionner une version</option>{data?.releases.map(release => <option value={release.version} key={release.version} disabled={!release.supported}>{release.version}</option>)}</select></label> : null}
      <button className={buttonClass} type="submit" disabled={busy || reading}>{busy ? 'Enregistrement…' : 'Appliquer la politique'}</button>
    </SettingsMutationForm>{error ? <p role="alert">{error}</p> : null}{status ? <Toast message={status} variant="success" className="mt-3" onClose={() => setStatus('')} /> : null}
  </section>;
}
