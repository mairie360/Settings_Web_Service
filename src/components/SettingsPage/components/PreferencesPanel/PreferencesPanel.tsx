"use client";

import { useEffect, useRef, useState } from 'react';
import { Alert } from '@mairie360/lib-components/primitives';
import { applyConfirmedAppearance } from '@mairie360/lib-components/theme';
import type { SettingsAppearancePatch, SettingsGeneralPatch, SettingsNotificationsPatch } from '@mairie360/bff-settings-openapi/model';
import type { SettingsBootstrapRead as SettingsBootstrap } from '@/lib/settings-bootstrap';
import * as api from '@/lib/settings-api';
import { emptyPreferences, preferencesAvailable, readSection, validPreferences } from './preferences';
import type { PreferenceSection, Values } from './preferences';
import { NotificationsPreferences } from './components/NotificationsPreferences';
import { AppearancePreferences } from './components/AppearancePreferences';
import { GeneralPreferences } from './components/GeneralPreferences';

export * from './preferences';

export interface PreferencesPanelProps {
  tab: string;
  bootstrap: SettingsBootstrap;
  reading: boolean;
  onWriting: (writing: boolean) => void;
  onRefresh: () => void;
  /** Receipts, shown by the page as toasts (« Option activée — … », « Langue et région enregistrées »). */
  onNotify: (message: string) => void;
  onFailure: (message: string) => void;
}

const SAVE_FAILED = 'Enregistrement impossible.';
const sources = (bootstrap: SettingsBootstrap): Values => ({
  appearance: readSection(bootstrap, 'appearance'), general: readSection(bootstrap, 'general'), notifications: readSection(bootstrap, 'notifications'),
});

/**
 * Notifications, Apparence and Général of the V2 mock-up (MAIR-902, MAIR-912, MAIR-921). Switches, lists and the slider save
 * at once (the value goes back and a toast says so when BFF_Settings refuses); « Langue et région » is a form with
 * Annuler / Enregistrer. Only a confirmed value reaches the displayed baseline and the shared appearance cookie.
 */
export default function PreferencesPanel({ tab, bootstrap, reading, onWriting, onRefresh, onNotify, onFailure }: PreferencesPanelProps) {
  const [received, setReceived] = useState(bootstrap);
  const [baseline, setBaseline] = useState<Values>(() => sources(bootstrap));
  // A new bootstrap (page return, refresh) replaces the sections it reads again; an unavailable one keeps the previous
  // values, and a section the new bootstrap carries unchanged (a profile save) keeps what a write confirmed since.
  if (received !== bootstrap) {
    const previous = received;
    setReceived(bootstrap);
    const fresh = (section: PreferenceSection) => preferencesAvailable(bootstrap, section)
      && (previous[section] !== bootstrap[section] || !preferencesAvailable(previous, section));
    setBaseline(current => ({
      appearance: fresh('appearance') ? readSection(bootstrap, 'appearance') : current.appearance,
      general: fresh('general') ? readSection(bootstrap, 'general') : current.general,
      notifications: fresh('notifications') ? readSection(bootstrap, 'notifications') : current.notifications,
    }));
  }
  useEffect(() => {
    // Font and density apply to the whole interface once confirmed; the theme stays light (MAIR-851).
    if (baseline.appearance !== emptyPreferences.appearance) applyConfirmedAppearance(baseline.appearance);
  }, [baseline.appearance]);
  const pending = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  /** Sends one patch of a section; resolves with the confirmed section, rejects (after a toast) when it is refused. */
  async function save<K extends PreferenceSection>(section: K, patch: Partial<Values[K]>, receipt: string): Promise<Values[K]> {
    if (pending.current) throw new Error('busy');
    pending.current = true; onWriting(true);
    try {
      const saved = section === 'appearance' ? await api.saveAppearance(patch as SettingsAppearancePatch)
        : section === 'general' ? await api.saveGeneral(patch as SettingsGeneralPatch) : await api.saveNotifications(patch as SettingsNotificationsPatch);
      if (!validPreferences(section, saved, true)) throw new Error('unconfirmed');
      if (alive.current) setBaseline(current => ({ ...current, [section]: saved }));
      onNotify(receipt);
      return saved as Values[K];
    } catch (reason) {
      onFailure(SAVE_FAILED);
      throw reason;
    } finally {
      pending.current = false;
      onWriting(false);
    }
  }

  if (!['appearance', 'general', 'notifications'].includes(tab)) return null;
  const section = tab as PreferenceSection;
  const available = preferencesAvailable(bootstrap, section);
  const unavailable = available ? null : <Alert tone="warning" role="alert" title="Préférences indisponibles"
    description="Ces réglages n’ont pas pu être chargés." actionLabel="Réessayer" onAction={reading ? undefined : onRefresh} className="mb-4" />;
  return <div className="settings-preferences space-y-5" data-section={section}>
    {unavailable}
    {section === 'notifications' ? <NotificationsPreferences values={baseline.notifications} disabled={!available || reading} save={(patch, receipt) => save('notifications', patch, receipt)} />
      : section === 'appearance' ? <AppearancePreferences values={baseline.appearance} disabled={!available || reading} save={(patch, receipt) => save('appearance', patch, receipt)} />
        : <GeneralPreferences values={baseline.general} disabled={!available || reading} save={(patch, receipt) => save('general', patch, receipt)} />}
  </div>;
}
