"use client";
import { useRef, useState } from "react";
import { ToastProvider } from "@mairie360/lib-components/primitives";
import { AccessibleShell } from "@mairie360/lib-components/shell";

import type { SettingsBootstrapRead as Bootstrap } from '../../lib/settings-bootstrap';
import { getActiveFrontHrefs } from '../../lib/navigation';
import { logoutAndRedirect } from '../../lib/logout';
import { usePageUrlState } from '../../lib/use-page-url-state';
import SettingsPendingFeatures from './components/SettingsPendingFeatures';
import PreferencesPanel from './components/PreferencesPanel';
import { ProfileForm } from './components/ProfileForm';
import { SessionsSection } from './components/SessionsSection';
import { SettingsTabs, settingsPanelId, settingsTabId } from './components/SettingsTabs';
import { settingsUrlSchema, tabFromUrl, tabToUrl } from './components/SettingsTabs';
import { SettingsHeader } from './components/SettingsHeader';
import { SettingsLoading } from './components/SettingsLoading';
import { SettingsNotices } from './components/SettingsNotices';
import { StatusToast } from './components/StatusToast';
import { TwoFactorSection } from './components/TwoFactorSection';
import { PasskeysSection } from './components/PasskeysSection';
import { LoginAlertsSection } from './components/LoginAlertsSection';
import { settingsPort } from '../../lib/settings-port';
import { useProfileForm } from './use-profile-form';
import { useSettingsData } from './use-settings-data';

/**
 * The settings page (MAIR-851): lib shell, title with the date, the six tabs and their panels, the loading and
 * unavailable states, and receipts as toasts at the top right; fed by `useSettingsData` and `useProfileForm`.
 */
export default function SettingsPage({ initialData }: { initialData?: Bootstrap | null }) {
  const settings = useSettingsData(initialData);
  const { data, setData, profile, reading, readError, readAnnouncement, accountScope, setPreferencesWriting, readSettings, reload } = settings;
  const form = useProfileForm(settings);
  const pageUrl = usePageUrlState(settingsUrlSchema);
  const activeTab = tabFromUrl(pageUrl.state.tab);
  const setActiveTab = (tab: typeof activeTab) => pageUrl.update({ tab: tabToUrl(tab) });
  const [logoutError, setLogoutError] = useState("");
  // Receipts of the security sections (MAIR-807, MAIR-811), shown as toasts like the profile ones.
  const [notice, setNotice] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const logoutPending = useRef(false);
  const requestLogout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    try { await logoutAndRedirect(); }
    catch (error) { setLogoutError(error instanceof Error ? error.message : "La déconnexion reste à vérifier."); }
    finally { logoutPending.current = false; }
  };
  const recoverable = !data || data.sources.sessions === "unavailable" || data.sources.preferences === "unavailable" || data.sources.notifications === "unavailable" || Boolean(readError);
  return (
    <AccessibleShell
      className="settings-shell"
      activeItem="settings"
      hrefs={getActiveFrontHrefs()}
      user={data ? { first_name: data.profile.first_name, last_name: data.profile.last_name, email: data.profile.email } : undefined}
      onLogout={() => void requestLogout()}
      sidebarProps={{ brandLogoSrc: "/mairie360-logo.png" }}
    >
      <ToastProvider regionLabel="Notifications de la page" placement="top-end" defaultDuration={5000}>
        <section className="settings-page">
          <SettingsHeader />
          <SettingsNotices readError={data ? readError : ""} logoutError={logoutError} recoverable={Boolean(data) && recoverable} hasData={Boolean(data)} reading={reading} saving={form.saving} onReload={reload} />
          <StatusToast message={form.status} title="Profil enregistré" onShown={form.clearStatus} />
          <StatusToast message={form.failure?.message ?? ""} title={form.failure?.title} tone="error" onShown={form.clearFailure} dismiss={form.saving} />
          <StatusToast message={notice?.message ?? ""} tone={notice?.tone} onShown={() => setNotice(null)} />
          <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{readAnnouncement}</p>
          {!data || !profile ? (
            <SettingsLoading reading={reading} failed={Boolean(readError)} onRetry={reload} />
          ) : (
            <>
              <SettingsTabs value={activeTab} onChange={setActiveTab} />
              <div role="tabpanel" id={settingsPanelId(activeTab)} aria-labelledby={settingsTabId(activeTab)} className="settings-panel">
                <SettingsPendingFeatures tab={activeTab} port={settingsPort}
                  preferencesContent={<PreferencesPanel key={accountScope} tab={activeTab} bootstrap={data} reading={reading || form.saving} onWriting={setPreferencesWriting} onRefresh={() => void readSettings()}
                    onNotify={(message) => setNotice({ message, tone: "success" })} onFailure={(message) => setNotice({ message, tone: "error" })} />}
                  profileContent={<ProfileForm form={form} reading={reading} />}
                  securityContent={<>
                    <TwoFactorSection onNotify={(message) => setNotice({ message, tone: "success" })} />
                    <LoginAlertsSection enabled={data.notifications?.login_alerts} disabled={reading || data.sources.notifications === "unavailable"}
                      onSaved={(notifications) => setData((current) => current ? { ...current, notifications } : current)}
                      onNotify={(message) => setNotice({ message, tone: "success" })} onFailure={(message) => setNotice({ message, tone: "error" })} />
                    <PasskeysSection onNotify={(message) => setNotice({ message, tone: "success" })} onFailure={(message) => setNotice({ message, tone: "error" })} />
                  </>}
                  sessionsContent={<SessionsSection data={data}
                    onSessions={(sessions, history) => setData((current) => current ? { ...current, sessions, session_history: history, sources: { ...current.sources, sessions: "available", session_history: "available" } } : current)}
                    onNotify={(message) => setNotice({ message, tone: "success" })} onFailure={(message) => setNotice({ message, tone: "error" })} />} />
              </div>
            </>
          )}
        </section>
      </ToastProvider>
    </AccessibleShell>
  );
}
