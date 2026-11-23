import { Bell, Globe, MonitorSmartphone, Palette, Shield, UserRound } from "lucide-react";

import { urlChoice } from '@/lib/page-url-state';

/** The six tabs of the V2 mock-up, in its order (MAIR-851). */
export const settingsTabs = [
  { id: "profile", label: "Profil", icon: UserRound },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "sessions", label: "Sessions", icon: MonitorSmartphone },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Apparence", icon: Palette },
  { id: "general", label: "Général", icon: Globe },
] as const;

export type SettingsTabId = (typeof settingsTabs)[number]["id"];

/**
 * Historical links stay readable: `notification-preferences` opens Notifications; the removed
 * « Système » tab (`system`, `system-assistance`) falls back to Profil like any unknown value.
 */
export const settingsUrlSchema = { tab: urlChoice([...settingsTabs.map(tab => tab.id), "notification-preferences"], "profile") };

export const tabFromUrl = (value: string): SettingsTabId => {
  if (value === "notification-preferences") return "notifications";
  return settingsTabs.some(tab => tab.id === value) ? value as SettingsTabId : "profile";
};

export const tabToUrl = (tab: SettingsTabId) => tab === "notifications" ? "notification-preferences" : tab;
