"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  assistanceFile, diagnosticFile, downloadLocalFile, MAX_ASSISTANCE_MESSAGE,
} from "@/lib/local-assistance";
import type { AssistanceKind } from "@/lib/local-assistance";

const buttonClass = "rounded border border-[#d8d2ca] px-4 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155bb5]";

export default function SettingsAssistance() {
  const [kind, setKind] = useState<AssistanceKind | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  function prepare(next: AssistanceKind) {
    setKind(next);
    setError("");
    setStatus("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!kind) return;
    setStatus("");
    setError("");
    if (!message.trim() || message.length > MAX_ASSISTANCE_MESSAGE) {
      setError("Décrivez votre demande en 1 à 5 000 caractères non vides.");
      return;
    }
    try {
      downloadLocalFile(assistanceFile(kind, message));
      setStatus("Téléchargement de la demande lancé. Aucun message n’a été envoyé.");
    } catch {
      setError("Le fichier n’a pas pu être préparé. Votre message est conservé ; vous pouvez le copier ou réessayer.");
    }
  }

  function downloadDiagnostic() {
    setStatus("");
    setError("");
    try {
      downloadLocalFile(diagnosticFile(navigator.userAgent, typeof URL.createObjectURL === "function"));
      setStatus("Téléchargement du diagnostic local lancé. Aucun fichier n’a été envoyé.");
    } catch {
      setError("Le diagnostic local n’a pas pu être préparé. Réessayez avec un navigateur autorisant les téléchargements.");
    }
  }

  return (
    <section className="space-y-5 rounded-lg border border-[#e0dbd4] bg-white p-6">
      <h2 className="text-xl font-semibold">Système et assistance</h2>
      <p>La version déployée, sa date de mise à jour et l’espace de stockage ne sont pas fournis par le service.</p>
      <details className="rounded border border-[#e0dbd4] p-4">
        <summary className="cursor-pointer font-semibold">Centre d’aide</summary>
        <div className="mt-3 space-y-2">
          <p>Dans Profil, modifiez vos coordonnées puis choisissez « Enregistrer ». La confirmation apparaît après la réponse du service.</p>
          <p>Dans Sécurité, consultez les sessions disponibles. Cette page ne permet pas encore de les révoquer ni de changer votre mot de passe.</p>
          <p>Les préférences Notifications, Apparence et Général ne sont pas encore disponibles.</p>
          <p>Les fichiers ci-dessous sont préparés dans votre navigateur. Relisez-les puis transmettez-les vous-même à votre équipe par votre canal habituel.</p>
        </div>
      </details>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={buttonClass} aria-expanded={kind === "support"} aria-controls="settings-assistance-form" onClick={() => prepare("support")}>Préparer une demande de support</button>
        <button type="button" className={buttonClass} aria-expanded={kind === "report"} aria-controls="settings-assistance-form" onClick={() => prepare("report")}>Signaler un problème</button>
      </div>
      <div id="settings-assistance-form">
        {kind ? (
          <form onSubmit={submit} aria-labelledby="settings-assistance-title" className="space-y-3">
            <h3 id="settings-assistance-title" className="font-semibold">{kind === "support" ? "Demande de support" : "Signalement"}</h3>
            <p id="settings-assistance-hint">Décrivez votre demande sans mot de passe ni donnée confidentielle. Aucun envoi automatique. Le brouillon disparaît si vous quittez cet onglet ou rechargez la page.</p>
            <label className="block" htmlFor="settings-assistance-message">Votre message</label>
            <textarea id="settings-assistance-message" required maxLength={MAX_ASSISTANCE_MESSAGE} rows={6}
              aria-describedby="settings-assistance-hint settings-assistance-count"
              className="w-full rounded border border-[#d8d2ca] p-3" value={message}
              onChange={(event) => { setMessage(event.target.value); setError(""); setStatus(""); }} />
            <p id="settings-assistance-count" className="text-sm">{message.length} / {MAX_ASSISTANCE_MESSAGE} caractères</p>
            <button className={buttonClass} type="submit">Télécharger la demande</button>
          </form>
        ) : null}
      </div>

      <section className="space-y-2" aria-labelledby="settings-diagnostic-title">
        <h3 id="settings-diagnostic-title" className="font-semibold">Diagnostic local</h3>
        <p>Contient uniquement le nom de ce module, la date, les familles estimées du navigateur et du système, et la disponibilité des URL de téléchargement. Ce ne sont pas des logs serveur ni un contrôle de disponibilité.</p>
        <p>Aucun profil, session, cookie, stockage, adresse de page ou journal n’est lu ni ajouté. Aucune donnée n’est transmise.</p>
        <button type="button" className={buttonClass} onClick={downloadDiagnostic}>Télécharger le diagnostic local</button>
      </section>
      {error ? <p role="alert" className="text-red-700">{error}</p> : null}
      {status ? <p role="status" className="text-green-800">{status}</p> : null}
    </section>
  );
}
