"use client";

import { AppShell } from "@mairie360/lib-components";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { loadSettings, saveProfile } from "@/lib/settings-api";
import { CURRENT_PASSWORD, PASSWORD_REQUIRED_MESSAGE, PROFILE_FIELDS, isEmailChanged, profilePatch, saveErrorMessage } from "@/lib/profile-form";
import type { ProfileField } from "@/lib/profile-form";
import { formatSessionDate } from "@/lib/session-date";
import SettingsPendingFeatures from "@/components/settings-pending-features";
import SessionRevokeControl from "@/components/settings-session-revoke";
import SettingsAssistance from "@/components/settings-assistance";
import SettingsTabIcon from "@/components/settings-tab-icon";
import { getActiveFrontHrefs } from "@/lib/navigation";
import { logoutAndRedirect, navigateToLogin } from "@/lib/logout";
import { loadSessionRole } from "@/lib/session-role";
import type {
  SettingsBootstrap as Bootstrap,
  SettingsProfile as Profile,
} from "@/lib/settings-api";

const tabs = [
  { id: "profile", label: "Profil" },
  { id: "security", label: "Sécurité" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Apparence" },
  { id: "general", label: "Général" },
  { id: "system", label: "Système" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function SessionDate({ value }: { value: string | null | undefined }) {
  const label = formatSessionDate(value);
  return label && value ? <time dateTime={value}>{label}</time> : <span>Date indisponible</span>;
}

function isConfirmedProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const profile = value as Record<string, unknown>;
  return typeof profile.first_name === "string"
    && typeof profile.last_name === "string"
    && typeof profile.email === "string"
    && (profile.phone === undefined || profile.phone === null || typeof profile.phone === "string");
}

function isConfirmedBootstrap(value: unknown): value is Bootstrap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const bootstrap = value as Record<string, unknown>;
  if (!isConfirmedProfile(bootstrap.profile) || !Array.isArray(bootstrap.sessions)) return false;
  if (!bootstrap.sources || typeof bootstrap.sources !== "object" || Array.isArray(bootstrap.sources)) return false;
  const sources = bootstrap.sources as Record<string, unknown>;
  if (sources.sessions !== "available" && sources.sessions !== "unavailable") return false;
  return bootstrap.sessions.every((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const session = value as Record<string, unknown>;
    return ["id", "device_info", "ip_address", "created_at", "expires_at"]
      .every((field) => typeof session[field] === "string")
      && (session.revoked_at === undefined || session.revoked_at === null || typeof session.revoked_at === "string");
  });
}

export default function Home() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  // Confirms an e-mail change (MAIR-511); never part of the profile state, cleared once used or no longer needed.
  const [currentPassword, setCurrentPassword] = useState("");
  const [readError, setReadError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void loadSessionRole(controller.signal).then(value => {
      if (!controller.signal.aborted) setIsAdmin(value);
    }).catch(() => undefined);
    return () => controller.abort();
  }, []);
  const logoutPending = useRef(false);
  const requestLogout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    try { await logoutAndRedirect(); }
    catch (error) { setLogoutError(error instanceof Error ? error.message : "La déconnexion reste à vérifier."); }
    finally { logoutPending.current = false; }
  };
  const [reading, setReading] = useState(true);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const readRef = useRef<AbortController | null>(null);
  const confirmedProfileRef = useRef<Profile | null>(null);

  const readSettings = useCallback(async () => {
    if (readRef.current || savingRef.current) return;
    const controller = new AbortController();
    const baseline = confirmedProfileRef.current;
    readRef.current = controller;

    try {
      const result = await loadSettings(controller.signal);
      if (controller.signal.aborted || readRef.current !== controller) return;
      if (!isConfirmedBootstrap(result)) {
        throw new Error("Les paramètres reçus sont incohérents. Réessayez.");
      }
      confirmedProfileRef.current = result.profile;
      setData(result);
      // Merge against the previous confirmed profile, including edits made during the read.
      setProfile((current) => baseline && current
        ? { ...result.profile, ...profilePatch(baseline, current) }
        : result.profile);
      setReadError("");
    } catch (reason) {
      if (!controller.signal.aborted && readRef.current === controller) {
        setReadError(reason instanceof Error ? reason.message : "Les paramètres n’ont pas pu être chargés.");
      }
    } finally {
      if (readRef.current === controller) {
        readRef.current = null;
        setReading(false);
      }
    }
  }, []);

  useEffect(() => {
    void readSettings();
    return () => {
      readRef.current?.abort();
      readRef.current = null;
    };
  }, [readSettings]);

  const patch = data && profile ? profilePatch(data.profile, profile) : {};
  const hasChanges = Object.keys(patch).length > 0;
  const emailChanged = data && profile ? isEmailChanged(data.profile, profile) : false;

  function updateProfile(field: ProfileField, value: string) {
    if (savingRef.current) return;
    setProfile((current) => current ? { ...current, [field]: value || (field === "phone" ? null : value) } : current);
    if (field === "email" && data && !isEmailChanged(data.profile, { ...data.profile, email: value })) setCurrentPassword("");
    clearSaveError();
    setStatus("");
  }

  function clearSaveError() {
    setError("");
    setErrorDetails([]);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentTab: TabId) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const current = tabs.findIndex(({ id }) => id === currentTab);
    const next = event.key === 'Home' ? 0
      : event.key === 'End' ? tabs.length - 1
      : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    setActiveTab(tabs[next].id);
    (event.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined)?.focus();
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (savingRef.current || readRef.current || !profile || !data || !hasChanges) return;
    // The BFF only changes the e-mail with the current password: refuse locally instead of a round trip.
    const password = emailChanged ? currentPassword : "";
    if (emailChanged && !password) {
      setErrorDetails([]);
      setError(PASSWORD_REQUIRED_MESSAGE);
      setStatus("");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    clearSaveError();
    setStatus("");

    try {
      const saved = await saveProfile(password ? { ...patch, current_password: password } : patch);
      if (!isConfirmedProfile(saved)) {
        throw new Error("L’enregistrement du profil n’a pas été confirmé. Réessayez.");
      }
      confirmedProfileRef.current = saved;
      setProfile(saved);
      setData((current) => current ? { ...current, profile: saved } : current);
      setCurrentPassword("");
      setStatus("Votre profil a été enregistré.");
    } catch (reason) {
      const { message, details } = saveErrorMessage(reason, Boolean(password));
      setError(message);
      setErrorDetails(details);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }


  const profileContent = data && profile ? (
<form onSubmit={save} aria-busy={saving || reading} className="mt-5 space-y-4">
                <div className="settings-profile-fields">
                {PROFILE_FIELDS.map(({ field, label, type, required, maxLength, pattern, help }) => (
                  <Fragment key={field}>
                    {/* The help text sits outside the label so the input's accessible name stays the label alone. */}
                    <div>
                      <label className="block">
                        <span className="mb-1 block">{label}</span>
                        <input
                          className="w-full rounded border border-[#d8d2ca] px-3 py-2"
                          type={type}
                          name={field}
                          required={required}
                          disabled={saving}
                          maxLength={maxLength}
                          pattern={pattern}
                          aria-describedby={help ? `settings-${field}-help` : undefined}
                          value={profile[field] ?? ""}
                          onChange={(event) => updateProfile(field, event.target.value)}
                        />
                      </label>
                      {help ? <span id={`settings-${field}-help`} className="mt-1 block text-sm text-[#596274]">{help}</span> : null}
                    </div>
                    {field === "email" && emailChanged ? (
                      <div>
                        <label className="block">
                          <span className="mb-1 block">{CURRENT_PASSWORD.label}</span>
                          <input
                            className="w-full rounded border border-[#d8d2ca] px-3 py-2"
                            type="password"
                            name={CURRENT_PASSWORD.field}
                            autoComplete="current-password"
                            required
                            disabled={saving}
                            maxLength={CURRENT_PASSWORD.maxLength}
                            aria-describedby="settings-current_password-help"
                            value={currentPassword}
                            onChange={(event) => { if (!savingRef.current) { setCurrentPassword(event.target.value); clearSaveError(); } }}
                          />
                        </label>
                        <span id="settings-current_password-help" className="mt-1 block text-sm text-[#596274]">{CURRENT_PASSWORD.help}</span>
                      </div>
                    ) : null}
                  </Fragment>
                ))}
                </div>
                <button
                  className="rounded bg-[#155bb5] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  type="submit"
                  disabled={saving || reading || !hasChanges}
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                {!hasChanges ? <p className="text-sm text-[#596274]">Aucune modification à enregistrer.</p> : null}
              </form>
  ) : null;

  const securityContent = data ? (
              <section className="space-y-3 rounded-lg border border-[#e0dbd4] bg-white p-6">
                <h2 className="text-xl font-semibold">Sessions</h2>
                {data.sources.sessions === "unavailable" ? (
                  <p>Les sessions sont temporairement indisponibles.</p>
                ) : data.sessions.length ? (
                  <ul>
                    {data.sessions.map((session) => (
                      <li className="border-b py-3 last:border-b-0" key={session.id}>
                        <p>{session.device_info} — {session.ip_address}</p>
                        <p className="text-sm">Création : <SessionDate value={session.created_at} /> · Expiration : <SessionDate value={session.expires_at} /></p>
                        {session.revoked_at ? <p className="text-sm text-[#7b3f00]">Révocation : <SessionDate value={session.revoked_at} /></p> : <SessionRevokeControl sessionId={session.id} label={session.device_info} />}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Aucune session à afficher.</p>
                )}
                <p className="text-sm text-[#596274]">L’identification de la session actuelle et les déconnexions individuelles restent à raccorder.</p>
              </section>
  ) : null;

  return (
    <AppShell
      className="settings-shell"
      activeItem="settings"
      isAdmin={isAdmin}
      hrefs={getActiveFrontHrefs()}
      user={data ? {
        first_name: data.profile.first_name,
        last_name: data.profile.last_name,
        email: data.profile.email,
      } : undefined}
      onLogout={() => void requestLogout()}
      sidebarProps={{ brandLogoSrc: "/mairie360-logo.png" }}
    >
      <section className="settings-page">
        <header>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p>Gérez votre profil, votre sécurité et vos préférences.</p>
        </header>

        {error ? (
          <div role="alert" className="rounded border border-red-200 bg-white p-4 text-red-700">
            <p>{error}</p>
            {errorDetails.length ? <ul className="mt-2 list-disc pl-5 text-sm">{errorDetails.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
          </div>
        ) : null}
        {readError ? <p role="alert" className="rounded border border-red-200 bg-white p-4 text-red-700">{readError}</p> : null}
        {logoutError ? <section role="alert" className="space-y-2 rounded border border-red-200 bg-white p-4 text-red-700">
          <p>{logoutError}</p>
          <button type="button" className="rounded border px-4 py-2 text-sm font-medium" onClick={() => navigateToLogin({ explicit: true })}>Retour à la connexion</button>
        </section> : null}
        {status ? <p role="status" className="rounded border border-green-200 bg-white p-4 text-green-800">{status}</p> : null}
        {!data || data.sources.sessions === "unavailable" || readError ? (
          <button
            type="button"
            className="rounded border border-[#d8d2ca] bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={reading || saving}
            aria-busy={reading}
            onClick={() => {
              if (readRef.current || savingRef.current) return;
              setReading(true);
              void readSettings();
            }}
          >
            {reading ? "Chargement…" : data ? "Actualiser les paramètres" : "Réessayer"}
          </button>
        ) : null}

        {!data || !profile ? (
          <p role="status">{!reading && readError ? "Le profil est indisponible." : "Chargement des paramètres…"}</p>
        ) : (
          <>
            <nav role="tablist" aria-label="Paramètres" className="settings-tabs">
              {tabs.map(({ id, label }) => (
                <button
                  key={id}
                  id={`settings-tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  aria-controls={activeTab === id ? `settings-panel-${id}` : undefined}
                  tabIndex={activeTab === id ? 0 : -1}
                  onClick={() => setActiveTab(id)}
                  onKeyDown={(event) => handleTabKeyDown(event, id)}
                  className="settings-tab"
                >
                  <SettingsTabIcon name={id} />
                  {label}
                </button>
              ))}
            </nav>

            <div role="tabpanel" id={`settings-panel-${activeTab}`} aria-labelledby={`settings-tab-${activeTab}`} className="settings-panel">
            <SettingsPendingFeatures tab={activeTab} isAdmin={isAdmin} profileContent={profileContent} securityContent={securityContent} systemContent={<SettingsAssistance />} />
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
