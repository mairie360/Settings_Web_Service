"use client";
import { Tabs } from "@mairie360/lib-components/primitives";

import { settingsTabs, type SettingsTabId } from "./settings-tabs";

export const SETTINGS_TABS_ID = "settings";
export const settingsPanelId = (tab: SettingsTabId) => `${SETTINGS_TABS_ID}-panel-${tab}`;
export const settingsTabId = (tab: SettingsTabId) => `${SETTINGS_TABS_ID}-tab-${tab}`;

/** The six settings tabs on the lib `Tabs` (arrow keys, Home, End); the page renders the panel itself. */
export const SettingsTabs = ({ value, onChange }: { value: SettingsTabId; onChange: (tab: SettingsTabId) => void }) => (
  <Tabs id={SETTINGS_TABS_ID} hostPanel label="Paramètres" className="settings-tabs" value={value} onChange={onChange}
    items={settingsTabs.map(({ id, label, icon }) => ({ key: id, label, icon }))} />
);
