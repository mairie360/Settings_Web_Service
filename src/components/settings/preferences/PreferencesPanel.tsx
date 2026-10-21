"use client";

import { useEffect, useRef, useState } from 'react';
import { Help, SaveButton, TextField, RefreshButton } from '@mairie360/lib-components/primitives';
import { applyConfirmedAppearance } from '@mairie360/lib-components/theme';
import type { SettingsAppearance, SettingsAppearancePatch, SettingsGeneral, SettingsGeneralPatch, SettingsNotifications, SettingsNotificationsPatch } from '@mairie360/bff-settings-openapi/model';
import type { SettingsBootstrapRead as SettingsBootstrap } from '@/lib/settings-bootstrap';
import * as api from '@/lib/settings-api';
import { changedFields } from '@/lib/settings-features';
import SettingsMutationForm from '../shared/SettingsMutationForm';
import { FailureToast, FeedbackToast } from '../shared/FeedbackToast';
import { PreferenceSelect } from './PreferenceSelect';
import { AppearancePreview } from './AppearancePreview';

type Values = { appearance: SettingsAppearance; general: SettingsGeneral; notifications: SettingsNotifications };
export type PreferenceSection = keyof Values;
type Feedback = Partial<Record<PreferenceSection, { message: string; failed: boolean }>>;
export const emptyPreferences: Values = {
  appearance: { theme: null, font_family: null, font_size: null, density: null },
  general: { language: null, timezone: null, date_format: null, home_page: null, auto_open_notifications: null },
  notifications: { email: null, push: null, desktop: null, messages: null, projects: null, calendar: null },
};
export const preferenceChoices = {
  theme: [['light', 'Clair'], ['dark', 'Sombre'], ['system', 'Système']],
  density: [['compact', 'Compacte'], ['normal', 'Normale'], ['comfortable', 'Confortable']],
  date_format: [['DD/MM/YYYY', 'Jour / mois / année'], ['MM/DD/YYYY', 'Mois / jour / année'], ['YYYY-MM-DD', 'Année - mois - jour']],
  home_page: [['dashboard', 'Tableau de bord'], ['projects', 'Projets'], ['calendar', 'Calendrier'], ['messages', 'Messagerie']],
} as const;
const onOff = [['true', 'Activées'], ['false', 'Désactivées']] as const;
export const sectionTitles: Record<PreferenceSection, string> = { appearance: 'Apparence', general: 'Préférences générales', notifications: 'Préférences de notification' };

// Null means inherit: the published contract supplies no concrete fallback value.
// Bootstrap reads may omit values; PATCH receipts must contain every contracted field.
export function validPreferences<K extends PreferenceSection>(section: K, value: unknown, complete = false): value is Values[K] {
  if (value == null) return !complete;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(emptyPreferences[section]).every(key => {
    if (record[key] === undefined) return !complete;
    if (record[key] === null) return true;
    if (section === 'notifications' || key === 'auto_open_notifications') return typeof record[key] === 'boolean';
    if (key === 'font_size') return typeof record[key] === 'number' && Number.isInteger(record[key]) && record[key] >= 1 && record[key] <= 32767;
    if (key === 'theme') return ['light', 'dark', 'system'].includes(record[key] as string);
    return typeof record[key] === 'string';
  });
}
function read<K extends PreferenceSection>(bootstrap: SettingsBootstrap, section: K): Values[K] {
  const raw = bootstrap[section] as unknown as Record<string, unknown> | null;
  return Object.fromEntries(Object.keys(emptyPreferences[section]).map(key => [key, raw?.[key] ?? null])) as unknown as Values[K];
}
export function preferencesAvailable(bootstrap: SettingsBootstrap, section: PreferenceSection) {
  return bootstrap.sources[section === 'notifications' ? 'notifications' : 'preferences'] === 'available' && validPreferences(section, bootstrap[section]);
}
function initialValues(bootstrap: SettingsBootstrap): Values {
  return {
    appearance: preferencesAvailable(bootstrap, 'appearance') ? read(bootstrap, 'appearance') : emptyPreferences.appearance,
    general: preferencesAvailable(bootstrap, 'general') ? read(bootstrap, 'general') : emptyPreferences.general,
    notifications: preferencesAvailable(bootstrap, 'notifications') ? read(bootstrap, 'notifications') : emptyPreferences.notifications,
  };
}
function reconcile<T extends object>(baseline: T, draft: T, incoming: T): T {
  return { ...incoming, ...changedFields(baseline, draft) };
}

/** Appearance fields of the draft (Figma 04 Apparence). */
export const AppearanceFields = ({ appearance, disabled, update }: { appearance: SettingsAppearance; disabled: boolean; update: <F extends keyof SettingsAppearance>(field: F, value: SettingsAppearance[F]) => void }) => <>
  <PreferenceSelect label="Thème" value={appearance.theme} options={preferenceChoices.theme} disabled={disabled} onChange={value => update('theme', (value || null) as SettingsAppearance['theme'])} />
  <TextField label="Police de caractères" className="mt-4" disabled={disabled} maxLength={128} pattern=".*\S.*" placeholder="Par défaut" value={appearance.font_family ?? ''} onChange={event => update('font_family', event.target.value || null)} />
  <TextField label="Taille de police (px)" className="mt-4" disabled={disabled} type="number" min={1} max={32767} step={1} placeholder="Par défaut" value={appearance.font_size ?? ''} onChange={event => update('font_size', event.target.value ? Number(event.target.value) : null)} />
  <PreferenceSelect label="Compacité de l’interface" value={appearance.density} options={preferenceChoices.density} disabled={disabled} onChange={value => update('density', value || null)} />
  <AppearancePreview appearance={appearance} />
</>;

/** General fields of the draft (Figma 05 Général). */
export const GeneralFields = ({ general, disabled, update }: { general: SettingsGeneral; disabled: boolean; update: <F extends keyof SettingsGeneral>(field: F, value: SettingsGeneral[F]) => void }) => <>
  <TextField label="Langue" className="mt-4" disabled={disabled} pattern="[a-z]{2,3}(-[A-Z]{2})?" placeholder="Par défaut" value={general.language ?? ''} onChange={event => update('language', event.target.value || null)} />
  <PreferenceSelect label="Format des dates" value={general.date_format} options={preferenceChoices.date_format} disabled={disabled} onChange={value => update('date_format', value || null)} />
  <PreferenceSelect label="Page d’accueil par défaut" value={general.home_page} options={preferenceChoices.home_page} disabled={disabled} onChange={value => update('home_page', value || null)} />
  <PreferenceSelect label="Ouverture automatique des notifications" value={general.auto_open_notifications} options={[['true', 'Activée'], ['false', 'Désactivée']]} disabled={disabled} onChange={value => update('auto_open_notifications', value === '' ? null : value === 'true')} />
</>;

export const notificationChannels = [['email', 'E-mail'], ['push', 'Notifications push'], ['desktop', 'Notifications sur le bureau'], ['messages', 'Messages'], ['projects', 'Projets'], ['calendar', 'Calendrier']] as const;
/** Notification fields of the draft (Figma 03 Notifications): a tri-state select per channel (default / on / off). */
export const NotificationFields = ({ notifications, disabled, update }: { notifications: SettingsNotifications; disabled: boolean; update: <F extends keyof SettingsNotifications>(field: F, value: SettingsNotifications[F]) => void }) => <>
  {notificationChannels.map(([field, label]) => <div key={field}><PreferenceSelect label={label} value={notifications[field]} options={onOff} disabled={disabled} onChange={value => update(field, value === '' ? null : value === 'true')} /></div>)}
</>;

export default function PreferencesPanel({ tab, bootstrap, reading, onWriting, onRefresh }: {
  tab: string; bootstrap: SettingsBootstrap; reading: boolean; onWriting: (writing: boolean) => void; onRefresh: () => void;
}) {
  const [state, setState] = useState(() => {
    const baseline = initialValues(bootstrap);
    return { received: bootstrap, baseline, draft: baseline, feedback: {} as Feedback };
  });
  useEffect(() => {
    // Only a confirmed baseline reaches the public display cache. Unavailable
    // reads keep the previous baseline; draft edits never change other fronts.
    if (state.baseline.appearance !== emptyPreferences.appearance) applyConfirmedAppearance(state.baseline.appearance);
  }, [state.baseline.appearance]);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  // Reconcile during render, so the next event always uses the received snapshot.
  // A failed or unavailable section never replaces a previous confirmed value.
  if (state.received !== bootstrap) {
    const next = initialValues(bootstrap);
    const baseline = { ...state.baseline };
    const draft = { ...state.draft };
    if (preferencesAvailable(bootstrap, 'appearance') && (state.received.appearance !== bootstrap.appearance || !preferencesAvailable(state.received, 'appearance'))) { baseline.appearance = next.appearance; draft.appearance = reconcile(state.baseline.appearance, state.draft.appearance, next.appearance); }
    if (preferencesAvailable(bootstrap, 'general') && (state.received.general !== bootstrap.general || !preferencesAvailable(state.received, 'general'))) { baseline.general = next.general; draft.general = reconcile(state.baseline.general, state.draft.general, next.general); }
    if (preferencesAvailable(bootstrap, 'notifications') && (state.received.notifications !== bootstrap.notifications || !preferencesAvailable(state.received, 'notifications'))) { baseline.notifications = next.notifications; draft.notifications = reconcile(state.baseline.notifications, state.draft.notifications, next.notifications); }
    setState({ ...state, received: bootstrap, baseline, draft });
  }

  function update<K extends PreferenceSection, F extends keyof Values[K]>(section: K, field: F, value: Values[K][F]) {
    if (pending.current) return;
    setState(current => ({ ...current, draft: { ...current.draft, [section]: { ...current.draft[section], [field]: value } }, feedback: { ...current.feedback, [section]: undefined } }));
  }
  async function save(section: PreferenceSection) {
    if (pending.current || reading || !preferencesAvailable(bootstrap, section)) return;
    const patch = changedFields(state.baseline[section], state.draft[section]);
    if (!Object.keys(patch).length) return;
    pending.current = true; setBusy(true); onWriting(true);
    setState(current => ({ ...current, feedback: { ...current.feedback, [section]: undefined } }));
    try {
      const saved = section === 'appearance'
        ? await api.saveAppearance(patch as SettingsAppearancePatch)
        : section === 'general' ? await api.saveGeneral(patch as SettingsGeneralPatch) : await api.saveNotifications(patch as SettingsNotificationsPatch);
      if (!validPreferences(section, saved, true)) throw new Error('L’enregistrement des préférences n’a pas été confirmé. Votre saisie est conservée.');
      if (!alive.current) return;
      setState(current => ({ ...current, baseline: { ...current.baseline, [section]: saved }, draft: { ...current.draft, [section]: saved }, feedback: { ...current.feedback, [section]: { message: 'Préférences enregistrées.', failed: false } } }));
    } catch (reason) {
      if (alive.current) setState(current => ({ ...current, feedback: { ...current.feedback, [section]: { message: reason instanceof Error ? reason.message : 'Les préférences n’ont pas pu être enregistrées. Votre saisie est conservée.', failed: true } } }));
    } finally {
      pending.current = false;
      if (alive.current) { setBusy(false); onWriting(false); }
    }
  }
  if (!['appearance', 'general', 'notifications'].includes(tab)) return null;
  const section = tab as PreferenceSection;
  const enabled = preferencesAvailable(bootstrap, section);
  const disabled = busy || !enabled;
  const feedback = state.feedback[section];
  const { appearance, general, notifications } = state.draft;
  const dismiss = () => setState(current => ({ ...current, feedback: { ...current.feedback, [section]: undefined } }));
  return <section className="settings-feature-card" aria-busy={busy}>
    <h2>{sectionTitles[section]}</h2>
    <Help>« Par défaut » conserve le comportement défini par votre compte. Vos modifications sont enregistrées uniquement après confirmation.</Help>
    {!enabled ? <><p role="alert">Ces préférences sont temporairement indisponibles. Votre saisie est conservée ; actualisez les paramètres pour réessayer.</p><RefreshButton label="Actualiser les préférences" variant="outline" tone="neutral" className="mt-3" disabled={reading || busy} onClick={onRefresh} /></> : null}
    <SettingsMutationForm data-form={`preferences-${section}`} onSubmit={event => { event.preventDefault(); void save(section); }}>
      {section === 'appearance' ? <AppearanceFields appearance={appearance} disabled={disabled} update={(field, value) => update('appearance', field, value)} />
        : section === 'general' ? <GeneralFields general={general} disabled={disabled} update={(field, value) => update('general', field, value)} />
        : <NotificationFields notifications={notifications} disabled={disabled} update={(field, value) => update('notifications', field, value)} />}
      <SaveButton type="submit" label={busy ? 'Enregistrement…' : 'Enregistrer les préférences'} variant="outline" tone="neutral" className="mt-5" disabled={disabled || reading || !Object.keys(changedFields(state.baseline[section], state.draft[section])).length} />
    </SettingsMutationForm>
    <FeedbackToast message={feedback && !feedback.failed ? feedback.message : ''} onClose={dismiss} />
    {feedback?.failed ? <FailureToast message={feedback.message} onClose={dismiss} /> : null}
  </section>;
}
