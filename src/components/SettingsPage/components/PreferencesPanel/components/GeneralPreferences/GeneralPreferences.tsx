"use client";
import { useState } from 'react';
import { FormActions, Panel, SelectField, SettingToggle } from '@mairie360/lib-components/primitives';
import type { SettingsGeneral } from '@mairie360/bff-settings-openapi/model';
import { choices, listValue } from '../../preferences';

export interface GeneralPreferencesProps {
  values: SettingsGeneral;
  disabled: boolean;
  save: (patch: Partial<SettingsGeneral>, receipt: string) => Promise<unknown>;
}

const FIELDS = ['language', 'timezone', 'date_format', 'home_page'] as const;
type Field = (typeof FIELDS)[number];
type Draft = Record<Field, string>;
const LABELS: Record<Field, string> = { language: 'Langue', timezone: 'Fuseau horaire', date_format: 'Format des dates', home_page: 'Page d’accueil' };

const confirmed = (values: SettingsGeneral): Draft =>
  Object.fromEntries(FIELDS.map(field => [field, listValue(field, values[field])])) as Draft;

/**
 * « Général » of the V2 mock-up (MAIR-921): « Langue et région » is a form (Annuler / Enregistrer, the count of
 * changed fields), the automatic opening of notifications a switch saved at once.
 */
export const GeneralPreferences = ({ values, disabled, save }: GeneralPreferencesProps) => {
  const baseline = confirmed(values);
  const [draft, setDraft] = useState<Partial<Draft>>({});
  const [busy, setBusy] = useState(false);
  const shown = { ...baseline, ...draft };
  const changed = FIELDS.filter(field => shown[field] !== baseline[field]);
  const status = changed.length === 0 ? 'Aucune modification à enregistrer.'
    : changed.length === 1 ? '1 champ modifié.' : `${changed.length} champs modifiés.`;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || disabled || changed.length === 0) return;
    setBusy(true);
    try {
      await save(Object.fromEntries(changed.map(field => [field, shown[field]])), 'Langue et région enregistrées');
      setDraft({});
    } catch { /* the page shows the refusal; the draft stays for another attempt */ }
    finally { setBusy(false); }
  };
  return <>
    <Panel title="Langue et région" description="Langue de l’interface, fuseau horaire et format des dates." className="settings-general">
      <form method="post" noValidate onSubmit={submit} aria-label="Langue et région" className="space-y-5">
        {FIELDS.map(field => <SelectField key={field} id={`settings-${field.replace('_', '-')}`} label={LABELS[field]} options={choices[field]}
          placeholder={null} disabled={disabled || busy} value={shown[field]}
          onChange={(value) => setDraft(current => ({ ...current, [field]: value }))} />)}
        <FormActions status={status} dirty={changed.length > 0} busy={busy} saveDisabled={disabled || changed.length === 0}
          saveLabel="Enregistrer" cancelLabel="Annuler" onCancel={() => setDraft({})} />
      </form>
    </Panel>
    <Panel title="Comportement" className="settings-general-behaviour">
      <SettingToggle id="settings-auto-open-notifications" label="Ouvrir automatiquement les notifications"
        description="Le centre de notifications s’ouvre quand une nouvelle notification arrive." checked={values.auto_open_notifications ?? false}
        disabled={disabled} onChange={async (checked) => { await save({ auto_open_notifications: checked }, `${checked ? 'Option activée' : 'Option désactivée'} — Ouverture automatique des notifications`); }}
        onError={() => undefined} />
    </Panel>
  </>;
};
