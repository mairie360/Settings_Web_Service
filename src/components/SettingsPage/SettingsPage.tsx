"use client";
import { useRef, useState } from "react";
import { Toast } from "@mairie360/lib-components/primitives";
import { AccessibleShell } from "@mairie360/lib-components/shell";
import { useInstanceRole } from "@mairie360/lib-components/react";

import type { SettingsBootstrapRead as Bootstrap } from '../../lib/settings-bootstrap';
import { getActiveFrontHrefs } from '../../lib/navigation';
import { logoutAndRedirect } from '../../lib/logout';
import { usePageUrlState } from '../../lib/use-page-url-state';
import SettingsPendingFeatures from './components/SettingsPendingFeatures';
import PreferencesPanel from './components/PreferencesPanel';
import { ProfileForm } from './components/ProfileForm';
import { SessionsSection } from './components/SessionsSection';
import SystemPanel from './components/SystemPanel';
import { SettingsTabs, settingsPanelId, settingsTabId } from './components/SettingsTabs';
import { settingsUrlSchema, tabFromUrl, tabToUrl } from './components/SettingsTabs';
import { SettingsHeader } from './components/SettingsHeader';
import { SettingsLoading } from './components/SettingsLoading';
import { SettingsNotices } from './components/SettingsNotices';
import { useProfileForm } from './use-profile-form';
import { useSettingsData } from './use-settings-data';

/** The settings page: shell, notices, header, six tabs and their panels, fed by `useSettingsData` and `useProfileForm`. */
export default function SettingsPage({ initialData, twoFactorUrl }: { initialData?: Bootstrap | null; twoFactorUrl?: string }) {
  const settings = useSettingsData(initialData);
  const { data, setData, profile, reading, readError, readAnnouncement, accountScope, setPreferencesWriting, readSettings, reload } = settings;
  const form = useProfileForm(settings);
  const pageUrl = usePageUrlState(settingsUrlSchema);
  const activeTab = tabFromUrl(pageUrl.state.tab);
  const setActiveTab = (tab: typeof activeTab) => pageUrl.update({ tab: tabToUrl(tab) });
  const [logoutError, setLogoutError] = useState("");
  const isAdmin = useInstanceRole() === "Admin";
  const logoutPending = useRef(false);
  const requestLogout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    try { await logoutAndRedirect(); }
    catch (error) { setLogoutError(error instanceof Error ? error.message : "La déconnexion reste à vérifier."); }
    finally { logoutPending.current = false; }
  };
  const recoverable = !data || data.sources.sessions === "unavailable" || data.sources.preferences === "unavailable" || data.sources.notifications === "unavailable" || Boolean(readError);
  const initials = data ? `${data.profile.first_name.trim().charAt(0)}${data.profile.last_name.trim().charAt(0)}`.toLocaleUpperCase("fr") || "?" : "?";
  return (
    <AccessibleShell
      className="settings-shell"
      activeItem="settings"
      hrefs={getActiveFrontHrefs()}
      user={data ? { first_name: data.profile.first_name, last_name: data.profile.last_name, email: data.profile.email } : undefined}
      onLogout={() => void requestLogout()}
      sidebarProps={{ brandLogoSrc: "/mairie360-logo.png" }}
    >
      <section className="settings-page">
        <SettingsHeader />
        <SettingsNotices error={form.error} errorDetails={form.errorDetails} readError={readError} logoutError={logoutError} recoverable={recoverable} hasData={Boolean(data)} reading={reading} saving={form.saving} onReload={reload} />
        <Toast message={form.status} tone="success" className={form.status ? "mt-4" : "sr-only"} onClose={form.status ? form.clearStatus : undefined} />
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{readAnnouncement}</p>
        {!data || !profile ? (
          <SettingsLoading reading={reading} failed={Boolean(readError)} />
        ) : (
          <>
            <SettingsTabs value={activeTab} onChange={setActiveTab} />
            <div role="tabpanel" id={settingsPanelId(activeTab)} aria-labelledby={settingsTabId(activeTab)} className="settings-panel">
              <SettingsPendingFeatures tab={activeTab} isAdmin={isAdmin} twoFactorUrl={twoFactorUrl} profileInitials={initials}
                preferencesContent={<PreferencesPanel key={accountScope} tab={activeTab} bootstrap={data} reading={reading || form.saving} onWriting={setPreferencesWriting} onRefresh={() => void readSettings()} />}
                profileContent={<ProfileForm form={form} reading={reading} />}
                securityContent={<SessionsSection data={data} onRevoked={(id, revokedAt) => setData((current) => current ? { ...current, sessions: current.sessions.map((session) => session.id === id ? { ...session, revoked_at: revokedAt } : session) } : current)} />}
                systemContent={<SystemPanel />} />
            </div>
          </>
        )}
      </section>
    </AccessibleShell>
  );
}
