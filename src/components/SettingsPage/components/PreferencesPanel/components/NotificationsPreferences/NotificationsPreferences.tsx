"use client";
import { Bell, CalendarDays, FolderKanban, ListChecks, Mail, MessageSquare, RefreshCw, Smartphone, type LucideIcon } from "lucide-react";
import { Panel, SettingToggle } from '@mairie360/lib-components/primitives';
import type { SettingsNotifications } from '@mairie360/bff-settings-openapi/model';

type Module = 'messaging' | 'projects' | 'calendar' | 'dashboard';

type Field = keyof SettingsNotifications;
export interface NotificationsPreferencesProps {
  values: SettingsNotifications;
  disabled: boolean;
  save: (patch: Partial<SettingsNotifications>, receipt: string) => Promise<unknown>;
}

/** The switches of the mock-up, in its two groups (MAIR-902). « Bureau » and SMS are not offered (C2). */
export const channels: ReadonlyArray<{ field: Field; label: string; description: string; icon: LucideIcon; module?: Module }> = [
  { field: 'email', label: 'Notifications par e-mail', description: 'Un résumé quotidien de votre activité.', icon: Mail },
  { field: 'push', label: 'Notifications push', description: 'Des alertes en temps réel sur cet appareil.', icon: Smartphone },
];
export const types: ReadonlyArray<{ field: Field; label: string; description: string; icon: LucideIcon; module?: Module }> = [
  { field: 'messages', label: 'Nouveaux messages', description: 'Quand une conversation reçoit un message.', icon: MessageSquare, module: 'messaging' },
  { field: 'projects', label: 'Tâches assignées', description: 'Quand une tâche vous est confiée.', icon: FolderKanban, module: 'projects' },
  { field: 'calendar', label: 'Événements du calendrier', description: 'Invitations et rappels de vos événements.', icon: CalendarDays, module: 'calendar' },
  { field: 'system_updates', label: 'Mises à jour de la plateforme', description: 'Les nouveautés et les maintenances prévues.', icon: RefreshCw, module: 'dashboard' },
];

// `null` is the account default, on for every notification.
const shown = (value: boolean | null | undefined) => value ?? true;

/** Each switch saves at once with a toast; a refusal brings it back (lib SettingToggle) and the page shows « Enregistrement impossible. ». */
export const NotificationsPreferences = ({ values, disabled, save }: NotificationsPreferencesProps) => {
  const toggle = ({ field, label, description, icon, module }: (typeof channels)[number]) => (
    <SettingToggle key={field} id={`settings-notification-${field}`} label={label} description={description}
      icon={icon} iconTone={module ? 'module' : 'neutral'} iconColor={module} checked={shown(values[field])} disabled={disabled}
      onChange={async (checked) => { await save({ [field]: checked }, `${checked ? 'Option activée' : 'Option désactivée'} — ${label}`); }} onError={() => undefined} />
  );
  return <>
    <Panel icon={Bell} title="Préférences de notification" description="Les changements s’appliquent immédiatement." className="settings-notifications-channels">
      {channels.map(toggle)}
    </Panel>
    <Panel icon={ListChecks} title="Types de notifications" className="settings-notifications-types">
      {types.map(toggle)}
    </Panel>
  </>;
};
