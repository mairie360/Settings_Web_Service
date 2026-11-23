"use client";
import { Panel, SettingToggle } from '@mairie360/lib-components/primitives';
import type { SettingsNotifications } from '@mairie360/bff-settings-openapi/model';

type Field = keyof SettingsNotifications;
export interface NotificationsPreferencesProps {
  values: SettingsNotifications;
  disabled: boolean;
  save: (patch: Partial<SettingsNotifications>, receipt: string) => Promise<unknown>;
}

/** The switches of the mock-up, in its two groups (MAIR-902). « Bureau » and SMS are not offered (C2). */
export const channels: ReadonlyArray<{ field: Field; label: string; description: string }> = [
  { field: 'email', label: 'Notifications par e-mail', description: 'Un résumé quotidien de votre activité.' },
  { field: 'push', label: 'Notifications push', description: 'Des alertes en temps réel sur cet appareil.' },
];
export const types: ReadonlyArray<{ field: Field; label: string; description: string }> = [
  { field: 'messages', label: 'Nouveaux messages', description: 'Quand une conversation reçoit un message.' },
  { field: 'projects', label: 'Tâches assignées', description: 'Quand une tâche vous est confiée.' },
  { field: 'calendar', label: 'Événements du calendrier', description: 'Invitations et rappels de vos événements.' },
  { field: 'system_updates', label: 'Mises à jour de la plateforme', description: 'Les nouveautés et les maintenances prévues.' },
];

// `null` is the account default, on for every notification.
const shown = (value: boolean | null | undefined) => value ?? true;

/** Each switch saves at once with a toast; a refusal brings it back (lib SettingToggle) and the page shows « Enregistrement impossible. ». */
export const NotificationsPreferences = ({ values, disabled, save }: NotificationsPreferencesProps) => {
  const toggle = ({ field, label, description }: (typeof channels)[number]) => (
    <SettingToggle key={field} id={`settings-notification-${field}`} label={label} description={description} checked={shown(values[field])} disabled={disabled}
      onChange={async (checked) => { await save({ [field]: checked }, `${checked ? 'Option activée' : 'Option désactivée'} — ${label}`); }} onError={() => undefined} />
  );
  return <>
    <Panel title="Préférences de notification" description="Les changements s’appliquent immédiatement." className="settings-notifications-channels">
      {channels.map(toggle)}
    </Panel>
    <Panel title="Types de notifications" className="settings-notifications-types">
      {types.map(toggle)}
    </Panel>
  </>;
};
