"use client";
import { Checkbox, Help, RadioGroup, SaveButton, SectionTitle, SelectField, Slider } from "@mairie360/lib-components/primitives";

import { changedFields } from '@/lib/settings-features';
import type { SettingsPreferences } from '@/lib/settings-features';

export interface DraftPreferencesProps {
  tab: "notifications" | "appearance" | "general";
  preferences: SettingsPreferences;
  confirmed: SettingsPreferences;
  busy: boolean;
  update: <K extends keyof SettingsPreferences>(key: K, value: SettingsPreferences[K]) => void;
  onSave: () => void;
  children?: React.ReactNode;
}

const titles = { notifications: "Préférences de notification", appearance: "Apparence", general: "Préférences générales" } as const;

/** The draft-only preferences card used when the account does not serve preferences yet (feature port). */
export const DraftPreferences = ({ tab, preferences, confirmed, busy, update, onSave, children }: DraftPreferencesProps) => (
  <section className="settings-feature-card">
    <SectionTitle>{titles[tab]}</SectionTitle>
    <Help>Vos choix restent un brouillon pendant cette visite. Ils ne sont pas encore synchronisés avec votre compte.</Help>
    {tab === "notifications" ? <div className="mt-4 space-y-3">
      {([["messages", "Messages"], ["projects", "Projets"], ["calendar", "Calendrier"]] as const).map(([key, label]) => (
        <Checkbox key={key} name={key} label={label} disabled={busy} checked={preferences[key]} onChange={event => update(key, event.target.checked)} />
      ))}
    </div> : tab === "appearance" ? <>
      <RadioGroup className="mt-4" label="Thème" name="settings-theme" inline disabled={busy} value={preferences.theme} options={[{ value: "light", label: "Clair" }, { value: "dark", label: "Sombre" }, { value: "system", label: "Système" }]} onChange={value => update("theme", value as SettingsPreferences["theme"])} />
      <SelectField className="mt-4" label="Police de caractères" value={preferences.fontFamily} disabled={busy} options={[{ value: "system", label: "Police système" }, { value: "sans", label: "Sans serif" }, { value: "serif", label: "Serif" }]} onChange={value => update("fontFamily", value as SettingsPreferences["fontFamily"])} />
      <Slider className="mt-4" label={`Taille de police : ${preferences.fontSize} px`} min={14} max={24} value={preferences.fontSize} disabled={busy} onChange={value => update("fontSize", value)} />
      <SelectField className="mt-4" label="Compacité de l’interface" value={preferences.density} disabled={busy} options={[{ value: "compact", label: "Compacte" }, { value: "normal", label: "Normale" }, { value: "comfortable", label: "Confortable" }]} onChange={value => update("density", value as SettingsPreferences["density"])} />
      <div aria-label="Aperçu de l’apparence" className="mt-4 rounded border" style={{ background: preferences.theme === "dark" ? "var(--mairie-navigation-background)" : "var(--mairie-surface)", color: preferences.theme === "dark" ? "var(--mairie-on-secondary)" : "var(--mairie-text)", fontFamily: preferences.fontFamily === "serif" ? "Georgia, serif" : "system-ui, sans-serif", fontSize: preferences.fontSize, padding: preferences.density === "compact" ? 8 : preferences.density === "comfortable" ? 24 : 16 }}><strong>Aperçu</strong><p>Votre environnement Mairie360</p></div>
    </> : <>
      <SelectField className="mt-4" label="Page d’accueil par défaut" disabled={busy} value={preferences.homePage} options={[["dashboard", "Tableau de bord"], ["projects", "Projets"], ["calendar", "Calendrier"], ["messages", "Messagerie"]].map(([value, label]) => ({ value, label }))} onChange={value => update("homePage", value as SettingsPreferences["homePage"])} />
      <Checkbox className="mt-4" name="autoOpenNotifications" label="Ouverture automatique des notifications" checked={preferences.autoOpenNotifications} disabled={busy} onChange={event => update("autoOpenNotifications", event.target.checked)} />
    </>}
    <SaveButton label="Enregistrer les préférences" variant="outline" tone="neutral" className="mt-5" disabled={busy || !Object.keys(changedFields(confirmed, preferences)).length} onClick={onSave} />
    {children}
  </section>
);
