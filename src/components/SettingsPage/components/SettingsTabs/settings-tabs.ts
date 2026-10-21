import { Bell, Globe, Info, Palette, Shield, UserRound } from "lucide-react";

import { urlChoice } from '@/lib/page-url-state';

export const settingsTabs = [
  { id: "profile", label: "Profil", icon: UserRound },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Apparence", icon: Palette },
  { id: "general", label: "Général", icon: Globe },
  { id: "system", label: "Système", icon: Info },
] as const;

export type SettingsTabId = (typeof settingsTabs)[number]["id"];

/** Historical links stay readable; new links name each section explicitly. */
export const settingsUrlSchema = { tab: urlChoice([...settingsTabs.map(tab => tab.id), "notification-preferences", "system-assistance"], "profile") };

export const tabFromUrl = (value: string): SettingsTabId =>
  (value === "notification-preferences" ? "notifications" : value === "system-assistance" ? "system" : value) as SettingsTabId;

export const tabToUrl = (tab: SettingsTabId) =>
  tab === "notifications" ? "notification-preferences" : tab === "system" ? "system-assistance" : tab;
