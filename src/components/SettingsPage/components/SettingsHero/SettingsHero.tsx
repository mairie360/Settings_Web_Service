"use client";
import { Avatar, PageHero } from "@mairie360/lib-components/primitives";
import { Bell, MonitorSmartphone, ShieldCheck } from "lucide-react";

import type { SettingsBootstrapRead as Bootstrap } from '@/lib/settings-bootstrap';
import type { SettingsTabId } from '../SettingsTabs';

export interface SettingsHeroProps {
  data: Bootstrap;
  /** Second factor of the account: `null` while it is read or when it could not be. */
  twoFactorEnabled: boolean | null;
  onOpen: (tab: SettingsTabId) => void;
}

const NOTIFICATION_FIELDS = ['email', 'push', 'messages', 'projects', 'calendar', 'system_updates'] as const;

/** Active sessions of the bootstrap (not revoked, not expired). */
export const activeSessions = (data: Bootstrap) =>
  data.sources.sessions === "unavailable" ? null : data.sessions.filter(session => !session.revoked_at && Date.parse(session.expires_at) > Date.now()).length;

/** Notifications switched on; `null` is the account default, on. */
export const enabledNotifications = (data: Bootstrap) => {
  if (data.sources.notifications === "unavailable") return null;
  const values = (data.notifications ?? {}) as Partial<Record<(typeof NOTIFICATION_FIELDS)[number], boolean | null>>;
  return NOTIFICATION_FIELDS.filter(field => values[field] ?? true).length;
};

/**
 * Header band of every tab (MAIR-1125, Figma C10): the agent's identity and three tiles that open the tab they
 * summarise, updated as the settings change: second factor, active sessions, notifications switched on.
 */
export const SettingsHero = ({ data, twoFactorEnabled, onOpen }: SettingsHeroProps) => {
  const name = `${data.profile.first_name} ${data.profile.last_name}`.trim();
  const sessions = activeSessions(data);
  const notifications = enabledNotifications(data);
  return (
    <PageHero className="settings-hero" overline="Paramètres du compte" title={name} subtitle={data.profile.email}
      avatar={<Avatar alt={name} size="xl" />}
      stats={<>
        <PageHero.Stat icon={ShieldCheck} label="Double authentification"
          value={twoFactorEnabled === null ? "—" : twoFactorEnabled ? "Activée" : "Désactivée"}
          dot={twoFactorEnabled === null ? undefined : twoFactorEnabled ? "success" : "warning"} onClick={() => onOpen("security")} />
        <PageHero.Stat icon={MonitorSmartphone} label="Sessions actives" value={sessions ?? "—"} onClick={() => onOpen("sessions")} />
        <PageHero.Stat icon={Bell} label="Notifications" value={notifications === null ? "—" : `${notifications} activée${notifications > 1 ? "s" : ""}`}
          onClick={() => onOpen("notifications")} />
      </>} />
  );
};
