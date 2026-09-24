"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { loadSettings, saveProfile } from "@/lib/settings-api";
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

const unavailableSections: Record<Exclude<TabId, "profile" | "security">, string> = {
  notifications: "Les préférences de notification ne sont pas encore exposées par le contrat BFF publié.",
  appearance: "Les préférences d’apparence ne sont pas encore exposées par le contrat BFF publié.",
  general: "Les préférences générales ne sont pas encore exposées par le contrat BFF publié.",
  system: "Les informations système ne sont pas fournies par le service et aucune valeur de remplacement n’est affichée.",
};

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
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void loadSettings(controller.signal)
      .then((result) => {
        setData(result);
        setProfile(result.profile);
      })
      .catch((reason: Error) => {
        if (!controller.signal.aborted) setError(reason.message);
      });

    return () => controller.abort();
  }, []);

  const patch = data && profile ? profilePatch(data.profile, profile) : {};
  const hasChanges = Object.keys(patch).length > 0;

  function updateProfile(field: ProfileField, value: string) {
    setProfile((current) => current ? { ...current, [field]: value || (field === "phone" ? null : value) } : current);
    setError("");
    setStatus("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!profile || !data || !hasChanges) return;

    setSaving(true);
    setError("");
    setStatus("");

    try {
      const saved = await saveProfile(patch);
      setProfile(saved);
      setData((current) => current ? { ...current, profile: saved } : current);
      setStatus("Votre profil a été enregistré.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Le profil n’a pas pu être enregistré.");
    } finally {
      setSaving(false);
    }
  }

  const activeLabel = tabs.find(({ id }) => id === activeTab)?.label ?? "Paramètres";

  return (
    <main className="min-h-screen bg-[#f5f3f0] px-4 py-6 text-[#172033] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1232px] space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p>Gérez les informations réellement disponibles pour votre compte.</p>
        </header>

        {error ? <p role="alert" className="rounded border border-red-200 bg-white p-4 text-red-700">{error}</p> : null}
        {status ? <p role="status" className="rounded border border-green-200 bg-white p-4 text-green-800">{status}</p> : null}

        {!data || !profile ? (
          <p role="status">{error ? "Le profil est indisponible." : "Chargement des paramètres…"}</p>
        ) : (
          <>
            <nav aria-label="Paramètres" className="flex flex-wrap gap-2">
              {tabs.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-current={activeTab === id ? "page" : undefined}
                  onClick={() => setActiveTab(id)}
                  className={`rounded px-4 py-2 ${activeTab === id ? "bg-[#155bb5] text-white" : "bg-white"}`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {activeTab === "profile" ? (
              <form onSubmit={save} className="space-y-4 rounded-lg border border-[#e0dbd4] bg-white p-6">
                <h2 className="text-xl font-semibold">Informations personnelles</h2>
                {profileFields.map(({ field, label, type, required }) => (
                  <label className="block" key={field}>
                    <span className="mb-1 block">{label}</span>
                    <input
                      className="w-full rounded border border-[#d8d2ca] px-3 py-2"
                      type={type}
                      required={required}
                      value={profile[field] ?? ""}
                      onChange={(event) => updateProfile(field, event.target.value)}
                    />
                  </label>
                ))}
                <button
                  className="rounded bg-[#155bb5] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  type="submit"
                  disabled={saving || !hasChanges}
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
                        <p className="text-sm">Créée le {session.created_at} · Expire le {session.expires_at}</p>
                        {session.revoked_at ? <p className="text-sm text-[#7b3f00]">Révoquée le {session.revoked_at}</p> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Aucune session à afficher.</p>
                )}
                <p className="text-sm text-[#596274]">Les autres réglages de sécurité ne sont pas encore disponibles.</p>
              </section>
            ) : (
              <section className="space-y-2 rounded-lg border border-[#e0dbd4] bg-white p-6">
                <h2 className="text-xl font-semibold">{activeLabel}</h2>
                <p className="font-medium">Fonctionnalité indisponible</p>
                <p>{unavailableSections[activeTab]}</p>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}
