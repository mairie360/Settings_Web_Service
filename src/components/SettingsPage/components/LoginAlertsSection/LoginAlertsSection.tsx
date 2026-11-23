"use client";
import { Panel, SettingToggle } from "@mairie360/lib-components/primitives";
import type { SettingsNotifications } from '@mairie360/bff-settings-openapi/model';

import * as api from '@/lib/settings-api';
import { validPreferences } from '../PreferencesPanel';

export interface LoginAlertsSectionProps {
  /** Confirmed value; `null` is the account default (off). */
  enabled: boolean | null | undefined;
  disabled: boolean;
  /** The notification settings BFF_Settings confirmed, so the Notifications tab shows them too. */
  onSaved: (notifications: SettingsNotifications) => void;
  onNotify: (message: string) => void;
  onFailure: (message: string) => void;
}

/** « Alertes de connexion » of the Security tab (MAIR-876): an e-mail at every new sign-in, saved at once. */
export const LoginAlertsSection = ({ enabled, disabled, onSaved, onNotify, onFailure }: LoginAlertsSectionProps) => (
  <Panel title="Alertes de connexion" className="settings-login-alerts">
    <SettingToggle id="settings-login-alerts" label="M’alerter par e-mail à chaque nouvelle connexion"
      description="Un e-mail indique l’appareil, l’adresse IP et l’heure de chaque connexion à votre compte."
      checked={enabled ?? false} disabled={disabled}
      onChange={async (checked) => {
        const saved = await api.saveNotifications({ login_alerts: checked });
        if (!validPreferences('notifications', saved, true)) throw new Error('unconfirmed');
        onSaved(saved);
        onNotify(checked ? 'Alertes de connexion activées.' : 'Alertes de connexion désactivées.');
      }}
      onError={() => onFailure('Enregistrement impossible.')} />
  </Panel>
);
