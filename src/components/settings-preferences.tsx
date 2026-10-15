"use client";

import { useEffect, useRef, useState } from 'react';
import { applyConfirmedAppearance, safeFontFamily } from '@mairie360/front-kit/theme';
import type { SettingsAppearance, SettingsAppearancePatch, SettingsBootstrap, SettingsGeneral, SettingsGeneralPatch, SettingsNotifications, SettingsNotificationsPatch } from '@mairie360/bff-settings-openapi/model';
import * as api from '@/lib/settings-api';
import { changedFields } from '@/lib/settings-features';

type Values = { appearance: SettingsAppearance; general: SettingsGeneral; notifications: SettingsNotifications };
type Section = keyof Values;
type Feedback = Partial<Record<Section, { message: string; failed: boolean }>>;
const empty: Values = {
  appearance: { theme: null, font_family: null, font_size: null, density: null },
  general: { language: null, timezone: null, date_format: null, home_page: null, auto_open_notifications: null },
  notifications: { email: null, push: null, desktop: null, messages: null, projects: null, calendar: null },
};
const choices = {
  theme: [['light', 'Clair'], ['dark', 'Sombre'], ['system', 'Système']],
  density: [['compact', 'Compacte'], ['normal', 'Normale'], ['comfortable', 'Confortable']],
  date_format: [['DD/MM/YYYY', 'Jour / mois / année'], ['MM/DD/YYYY', 'Mois / jour / année'], ['YYYY-MM-DD', 'Année - mois - jour']],
  home_page: [['dashboard', 'Tableau de bord'], ['projects', 'Projets'], ['calendar', 'Calendrier'], ['messages', 'Messagerie']],
};
const fieldClass = 'mt-1 w-full rounded border border-[#cbd5e1] bg-white px-3 py-2 text-[#172033]';

// Null means inherit: the published contract supplies no concrete fallback value.
// Bootstrap reads may omit values; PATCH receipts must contain every contracted field.
function valid<K extends Section>(section: K, value: unknown, complete = false): value is Values[K] {
  if (value == null) return !complete;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(empty[section]).every(key => {
    if (record[key] === undefined) return !complete;
    if (record[key] === null) return true;
    if (section === 'notifications' || key === 'auto_open_notifications') return typeof record[key] === 'boolean';
    if (key === 'font_size') return typeof record[key] === 'number' && Number.isInteger(record[key]) && record[key] >= 1 && record[key] <= 32767;
    if (key === 'theme') return ['light', 'dark', 'system'].includes(record[key] as string);
    return typeof record[key] === 'string';
  });
}
function read<K extends Section>(bootstrap: SettingsBootstrap, section: K): Values[K] {
  const raw = bootstrap[section] as unknown as Record<string, unknown> | null;
  return Object.fromEntries(Object.keys(empty[section]).map(key => [key, raw?.[key] ?? null])) as unknown as Values[K];
}
function available(bootstrap: SettingsBootstrap, section: Section) {
  return bootstrap.sources[section === 'notifications' ? 'notifications' : 'preferences'] === 'available' && valid(section, bootstrap[section]);
}
function initialValues(bootstrap: SettingsBootstrap): Values {
  return {
    appearance: available(bootstrap, 'appearance') ? read(bootstrap, 'appearance') : empty.appearance,
    general: available(bootstrap, 'general') ? read(bootstrap, 'general') : empty.general,
    notifications: available(bootstrap, 'notifications') ? read(bootstrap, 'notifications') : empty.notifications,
  };
}
function reconcile<T extends object>(baseline: T, draft: T, incoming: T): T {
  return { ...incoming, ...changedFields(baseline, draft) };
}

export default function SettingsPreferencesPanel({ tab, bootstrap, reading, onWriting, onRefresh }: {
  tab: string; bootstrap: SettingsBootstrap; reading: boolean; onWriting: (writing: boolean) => void; onRefresh: () => void;
}) {
  const [state, setState] = useState(() => {
    const baseline = initialValues(bootstrap);
    return { received: bootstrap, baseline, draft: baseline, feedback: {} as Feedback };
  });
  useEffect(() => {
    // Only a confirmed baseline reaches the public display cache. Unavailable
    // reads keep the previous baseline; draft edits never change other fronts.
    if (state.baseline.appearance !== empty.appearance) applyConfirmedAppearance(state.baseline.appearance);
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
    if (available(bootstrap, 'appearance') && (state.received.appearance !== bootstrap.appearance || !available(state.received, 'appearance'))) { baseline.appearance = next.appearance; draft.appearance = reconcile(state.baseline.appearance, state.draft.appearance, next.appearance); }
    if (available(bootstrap, 'general') && (state.received.general !== bootstrap.general || !available(state.received, 'general'))) { baseline.general = next.general; draft.general = reconcile(state.baseline.general, state.draft.general, next.general); }
    if (available(bootstrap, 'notifications') && (state.received.notifications !== bootstrap.notifications || !available(state.received, 'notifications'))) { baseline.notifications = next.notifications; draft.notifications = reconcile(state.baseline.notifications, state.draft.notifications, next.notifications); }
    setState({ ...state, received: bootstrap, baseline, draft });
  }

  function update<K extends Section, F extends keyof Values[K]>(section: K, field: F, value: Values[K][F]) {
    if (pending.current) return;
    setState(current => ({ ...current, draft: { ...current.draft, [section]: { ...current.draft[section], [field]: value } }, feedback: { ...current.feedback, [section]: undefined } }));
  }
  async function save(section: Section) {
    if (pending.current || reading || !available(bootstrap, section)) return;
    const patch = changedFields(state.baseline[section], state.draft[section]);
    if (!Object.keys(patch).length) return;
    pending.current = true; setBusy(true); onWriting(true);
    setState(current => ({ ...current, feedback: { ...current.feedback, [section]: undefined } }));
    try {
      const saved = section === 'appearance'
        ? await api.saveAppearance(patch as SettingsAppearancePatch)
        : section === 'general' ? await api.saveGeneral(patch as SettingsGeneralPatch) : await api.saveNotifications(patch as SettingsNotificationsPatch);
      if (!valid(section, saved, true)) throw new Error('L’enregistrement des préférences n’a pas été confirmé. Votre saisie est conservée.');
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
  const section = tab as Section;
  const enabled = available(bootstrap, section);
  const disabled = busy || !enabled;
  const feedback = state.feedback[section];
  const { appearance, general, notifications } = state.draft;
  function select(label: string, value: string | boolean | null, options: string[][], change: (value: string) => void) {
    const current = value === null ? '' : String(value);
    return <label className="block mt-4">{label}<select className={fieldClass} disabled={disabled} value={current} onChange={event => change(event.target.value)}>
      <option value="">Par défaut</option>
      {current && !options.some(([option]) => option === current) ? <option value={current}>{current}</option> : null}
      {options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}
    </select></label>;
  }
  return <section className="settings-feature-card" aria-busy={busy}>
    <h2>{section === 'appearance' ? 'Apparence' : section === 'general' ? 'Préférences générales' : 'Préférences de notification'}</h2>
    <p className="text-sm">« Par défaut » conserve le comportement défini par votre compte. Vos modifications sont enregistrées uniquement après confirmation.</p>
    {!enabled ? <><p role="alert">Ces préférences sont temporairement indisponibles. Votre saisie est conservée ; actualisez les paramètres pour réessayer.</p><button type="button" className="mt-3 rounded border px-4 py-2 disabled:opacity-50" disabled={reading || busy} onClick={onRefresh}>Actualiser les préférences</button></> : null}
    <form onSubmit={event => { event.preventDefault(); void save(section); }}>
      {section === 'appearance' ? <>
        {select('Thème', appearance.theme, choices.theme, value => update('appearance', 'theme', (value || null) as SettingsAppearance['theme']))}
        <label className="block mt-4">Police de caractères<input className={fieldClass} disabled={disabled} maxLength={128} pattern=".*\S.*" placeholder="Par défaut" value={appearance.font_family ?? ''} onChange={event => update('appearance', 'font_family', event.target.value || null)} /></label>
        <label className="block mt-4">Taille de police (px)<input className={fieldClass} disabled={disabled} type="number" min={1} max={32767} step={1} placeholder="Par défaut" value={appearance.font_size ?? ''} onChange={event => update('appearance', 'font_size', event.target.value ? Number(event.target.value) : null)} /></label>
        {select('Compacité de l’interface', appearance.density, choices.density, value => update('appearance', 'density', value || null))}
        <div aria-label="Aperçu de l’apparence" data-preview-theme={appearance.theme ?? 'system'} className="mairie-appearance-preview mt-4 rounded border" style={{ colorScheme: appearance.theme === 'system' || appearance.theme === null ? 'light dark' : appearance.theme, fontFamily: safeFontFamily(appearance.font_family), fontSize: appearance.font_size === null ? undefined : Math.min(24, Math.max(12, appearance.font_size)), padding: appearance.density === 'compact' ? 8 : appearance.density === 'comfortable' ? 24 : 16 }}><strong>Aperçu</strong><p>Votre environnement Mairie360</p></div><p className="mt-2 text-sm">La taille de cet aperçu est limitée entre 12 et 24 px. La taille de lecture commune de l’interface reste conservée.</p>
      </> : section === 'general' ? <>
        <label className="block mt-4">Langue<input className={fieldClass} disabled={disabled} pattern="[a-z]{2,3}(-[A-Z]{2})?" placeholder="Par défaut" value={general.language ?? ''} onChange={event => update('general', 'language', event.target.value || null)} /></label>
        {select('Format des dates', general.date_format, choices.date_format, value => update('general', 'date_format', value || null))}
        {select('Page d’accueil par défaut', general.home_page, choices.home_page, value => update('general', 'home_page', value || null))}
        {select('Ouverture automatique des notifications', general.auto_open_notifications, [['true', 'Activée'], ['false', 'Désactivée']], value => update('general', 'auto_open_notifications', value === '' ? null : value === 'true'))}
      </> : <>{([['email', 'E-mail'], ['push', 'Notifications push'], ['desktop', 'Notifications sur le bureau'], ['messages', 'Messages'], ['projects', 'Projets'], ['calendar', 'Calendrier']] as const).map(([field, label]) => <div key={field}>{select(label, notifications[field], [['true', 'Activées'], ['false', 'Désactivées']], value => update('notifications', field, value === '' ? null : value === 'true'))}</div>)}</>}
      <button type="submit" className="mt-5 rounded border border-[#cbd5e1] bg-white px-4 py-2 text-[#172033] disabled:opacity-50" disabled={disabled || reading || !Object.keys(changedFields(state.baseline[section], state.draft[section])).length}>{busy ? 'Enregistrement…' : 'Enregistrer les préférences'}</button>
    </form>
    <p role="status" aria-live="polite" aria-atomic="true" className={feedback && !feedback.failed ? 'mt-3 text-sm' : 'sr-only'}>{feedback && !feedback.failed ? feedback.message : ''}</p>
    {feedback?.failed ? <p role="alert" className="mt-3 text-sm">{feedback.message}</p> : null}
  </section>;
}
