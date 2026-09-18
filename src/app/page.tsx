"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { loadSettings, saveProfile } from "@/lib/settings-api";
import type { SettingsBootstrap as Bootstrap, SettingsProfile as Profile } from "@/lib/settings-api";

const tabs = ["Profil", "Sécurité", "Notifications", "Apparence", "Général", "Système"];
export default function Home() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState("Profil");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void loadSettings(controller.signal).then((result) => { setData(result); setProfile(result.profile); }).catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault(); if (!profile) return;
    setSaving(true); setError(""); setStatus("");
    try {
      const saved = await saveProfile(profile);
      setProfile(saved); setData((current) => current ? { ...current, profile: saved } : current); setStatus("Votre profil a été enregistré.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Le profil n’a pas pu être enregistré."); }
    finally { setSaving(false); }
  }
  return (
    <main className="min-h-screen bg-[#f5f3f0] px-4 py-6 text-[#172033] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1232px] space-y-6">
        <header><h1 className="text-3xl font-bold">Paramètres</h1><p>Gérez votre profil et vos sessions</p></header>
        {error && <p role="alert" className="rounded border border-red-200 bg-white p-4 text-red-700">{error}</p>}
        {status && <p role="status" className="rounded bg-white p-4">{status}</p>}
        {!data || !profile ? <p role="status">{error ? "Le profil est indisponible." : "Chargement des paramètres…"}</p> : <>
          <nav aria-label="Paramètres" className="flex flex-wrap gap-2">{tabs.map((tab) => <button key={tab} type="button" aria-current={activeTab === tab ? "page" : undefined} onClick={() => setActiveTab(tab)} className={`rounded px-4 py-2 ${activeTab === tab ? "bg-[#155bb5] text-white" : "bg-white"}`}>{tab}</button>)}</nav>
          {activeTab === "Profil" ? <form onSubmit={save} className="space-y-4 rounded-lg border border-[#e0dbd4] bg-white p-6">
            <h2 className="text-xl font-semibold">Informations personnelles</h2>
            {([["first_name", "Prénom"], ["last_name", "Nom"], ["email", "E-mail"], ["phone", "Téléphone"]] as const).map(([field, label]) => <label className="block" key={field}><span className="mb-1 block">{label}</span><input className="w-full rounded border border-[#d8d2ca] px-3 py-2" type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} required={field !== "phone"} value={profile[field] ?? ""} onChange={(event) => setProfile({ ...profile, [field]: event.target.value })} /></label>)}
            <button className="rounded bg-[#155bb5] px-4 py-2 text-white disabled:opacity-50" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
          </form> : activeTab === "Sécurité" ? <section className="space-y-3 rounded-lg bg-white p-6"><h2 className="text-xl font-semibold">Sessions</h2>
            {data.sources.sessions === "unavailable" ? <p>Les sessions sont temporairement indisponibles.</p> : data.sessions.length ? <ul>{data.sessions.map((session) => <li className="border-b py-3" key={session.id}>{session.device_info} — {session.ip_address}<p className="text-sm">Créée le {session.created_at} · Expire le {session.expires_at}</p></li>)}</ul> : <p>Aucune session à afficher.</p>}
            <p>Les autres réglages de sécurité ne sont pas encore disponibles.</p>
          </section> : <section className="rounded-lg bg-white p-6"><h2 className="text-xl font-semibold">{activeTab}</h2><p>Ces réglages ne sont pas encore disponibles.</p></section>}
        </>}
      </section>
    </main>
  );
}
