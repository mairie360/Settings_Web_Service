"use client";

import { AppShell } from "@mairie360/lib-components";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { loadSettings, saveProfile } from "@/lib/settings-api";
import { formatSessionDate } from "@/lib/session-date";
import SettingsAssistance from "@/components/settings-assistance";
import SettingsTabIcon from "@/components/settings-tab-icon";
import { getActiveFrontHrefs } from "@/lib/navigation";
import { logoutAndRedirect } from "@/lib/logout";
import type {
  SettingsBootstrap as Bootstrap,
  SettingsProfile as Profile,
  SettingsProfilePatch as ProfilePatch,
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
type ProfileField = keyof ProfilePatch;

const profileFields: ReadonlyArray<{
  field: ProfileField;
  label: string;
  type: "email" | "tel" | "text";
  required: boolean;
}> = [
  { field: "first_name", label: "Prénom", type: "text", required: true },
  { field: "last_name", label: "Nom", type: "text", required: true },
  { field: "email", label: "E-mail", type: "email", required: true },
  { field: "phone", label: "Téléphone", type: "tel", required: false },
];

const unavailableSections: Record<Exclude<TabId, "profile" | "security" | "system">, string> = {
  notifications: "Les préférences de notification ne sont pas encore disponibles. Aucun réglage ne peut être enregistré pour le moment.",
  appearance: "Les préférences d’apparence ne sont pas encore disponibles. Aucun réglage ne peut être enregistré pour le moment.",
  general: "Les préférences générales ne sont pas encore disponibles. Aucun réglage ne peut être enregistré pour le moment.",
};

function SessionDate({ value }: { value: string | null | undefined }) {
  const label = formatSessionDate(value);
  return label && value ? <time dateTime={value}>{label}</time> : <span>Date indisponible</span>;
}

function profilePatch(initial: Profile, current: Profile): ProfilePatch {
  const patch: ProfilePatch = {};

  if (current.first_name !== initial.first_name) patch.first_name = current.first_name;
  if (current.last_name !== initial.last_name) patch.last_name = current.last_name;
  if (current.email !== initial.email) patch.email = current.email;
  if (current.phone !== initial.phone) patch.phone = current.phone ?? null;

  return patch;
}

export default function Home() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [error, setError] = useState("");
  const [readError, setReadError] = useState("");
  const [logoutError, setLogoutError] = useState("");
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

  function updateProfile(field: ProfileField, value: string) {
    if (savingRef.current) return;
    setProfile((current) => current ? { ...current, [field]: value || (field === "phone" ? null : value) } : current);
    setError("");
    setStatus("");
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

    savingRef.current = true;
    setSaving(true);
    setError("");
    setStatus("");

    try {
      const saved = await saveProfile(patch);
      confirmedProfileRef.current = saved;
      setProfile(saved);
      setData((current) => current ? { ...current, profile: saved } : current);
      setStatus("Votre profil a été enregistré.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Le profil n’a pas pu être enregistré.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const activeLabel = tabs.find(({ id }) => id === activeTab)?.label ?? "Paramètres";

  return (
    <AppShell
      className="settings-shell"
      activeItem="settings"
      hrefs={getActiveFrontHrefs()}
      user={data ? {
        first_name: data.profile.first_name,
        last_name: data.profile.last_name,
        email: data.profile.email,
      } : undefined}
      onLogout={() => void logoutAndRedirect().catch(() => setLogoutError("La déconnexion est temporairement indisponible."))}
      sidebarProps={{ brandLogoSrc: "/mairie360-logo.png" }}
    >
      <section className="settings-page">
        <header>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p>Gérez les informations réellement disponibles pour votre compte.</p>
        </header>

        {error ? <p role="alert" className="rounded border border-red-200 bg-white p-4 text-red-700">{error}</p> : null}
        {readError ? <p role="alert" className="rounded border border-red-200 bg-white p-4 text-red-700">{readError}</p> : null}
        {logoutError ? <p role="alert" className="rounded border border-red-200 bg-white p-4 text-red-700">{logoutError}</p> : null}
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
            {activeTab === "profile" ? (
              <form onSubmit={save} aria-busy={saving || reading} className="space-y-4 rounded-lg border border-[#e0dbd4] bg-white p-6">
                <h2 className="text-xl font-semibold">Informations personnelles</h2>
                <div className="settings-profile-fields">
                {profileFields.map(({ field, label, type, required }) => (
                  <label className="block" key={field}>
                    <span className="mb-1 block">{label}</span>
                    <input
                      className="w-full rounded border border-[#d8d2ca] px-3 py-2"
                      type={type}
                      required={required}
                      disabled={saving}
                      value={profile[field] ?? ""}
                      onChange={(event) => updateProfile(field, event.target.value)}
                    />
                  </label>
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
            ) : activeTab === "security" ? (
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
                        {session.revoked_at ? <p className="text-sm text-[#7b3f00]">Révocation : <SessionDate value={session.revoked_at} /></p> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Aucune session à afficher.</p>
                )}
                <p className="text-sm text-[#596274]">Les autres réglages de sécurité ne sont pas encore disponibles.</p>
              </section>
            ) : activeTab === "system" ? (
              <SettingsAssistance />
            ) : (
              <section className="space-y-2 rounded-lg border border-[#e0dbd4] bg-white p-6">
                <h2 className="text-xl font-semibold">{activeLabel}</h2>
                <p className="font-medium">Fonctionnalité indisponible</p>
                <p>{unavailableSections[activeTab]}</p>
              </section>
            )}
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
