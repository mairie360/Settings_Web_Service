"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import {
  assistanceFile, diagnosticFile, downloadLocalFile, MAX_ASSISTANCE_MESSAGE,
} from "@/lib/local-assistance";
import type { AssistanceKind } from "@/lib/local-assistance";
import SettingsBrowserInformation from "@/components/settings-browser-information";

const buttonClass = "rounded border border-[#d8d2ca] px-4 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155bb5]";

export default function SettingsAssistance() {
  const [kind, setKind] = useState<AssistanceKind | "help" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    if (kind) {
      if (!modal.open) modal.showModal();
      (kind === "help" ? heading.current : messageInput.current)?.focus();
    } else if (modal.open) modal.close();
  }, [kind]);

  function prepare(next: AssistanceKind | "help", event: MouseEvent<HTMLButtonElement>) {
    trigger.current = event.currentTarget;
    setKind(next);
    setMessage("");
    setError("");
    setStatus("");
  }

  function keepDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement | HTMLTextAreaElement>("button:not([disabled]), textarea:not([disabled])"));
    const current = controls.findIndex((control) => control === document.activeElement);
    if (current === -1 || (event.shiftKey && current === 0) || (!event.shiftKey && current === controls.length - 1)) {
      event.preventDefault();
      controls[event.shiftKey ? controls.length - 1 : 0]?.focus();
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!kind || kind === "help") return;
    setStatus("");
    setError("");
    if (!message.trim() || message.length > MAX_ASSISTANCE_MESSAGE) {
      setError("Décrivez votre demande en 1 à 5 000 caractères non vides.");
      return;
    }
    try {
      downloadLocalFile(assistanceFile(kind, message));
      setKind(null);
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
      <SettingsBrowserInformation />
      <div className="flex flex-wrap gap-3">
        <button type="button" className={buttonClass} aria-haspopup="dialog" aria-expanded={kind === "help"} aria-controls="settings-assistance-dialog" onClick={(event) => prepare("help", event)}>Centre d’aide</button>
        <button type="button" className={buttonClass} aria-haspopup="dialog" aria-expanded={kind === "support"} aria-controls="settings-assistance-dialog" onClick={(event) => prepare("support", event)}>Préparer une demande de support</button>
        <button type="button" className={buttonClass} aria-haspopup="dialog" aria-expanded={kind === "report"} aria-controls="settings-assistance-dialog" onClick={(event) => prepare("report", event)}>Signaler un problème</button>
      </div>

      <dialog ref={dialog} id="settings-assistance-dialog" className="settings-assistance-dialog"
        aria-labelledby="settings-assistance-title"
        onKeyDown={keepDialogFocus}
        onCancel={() => setKind(null)}
        onClose={() => { if (!dialog.current?.open) { setKind(null); trigger.current?.focus(); } }}>
        {kind ? <>
          <h3 ref={heading} id="settings-assistance-title" tabIndex={-1} className="text-xl font-semibold">
            {kind === "help" ? "Centre d’aide" : kind === "support" ? "Demande de support" : "Signalement"}
          </h3>
          {kind === "help" ? <div className="space-y-2">
            <p>Dans Profil, modifiez vos coordonnées puis choisissez « Enregistrer ». La confirmation apparaît après la réponse du service.</p>
            <p>Dans Sécurité, consultez les sessions disponibles. Cette page ne permet pas encore de les révoquer ni de changer votre mot de passe.</p>
            <p>Les préférences Notifications, Apparence et Général ne sont pas encore disponibles.</p>
            <p>Les fichiers ci-dessous sont préparés dans votre navigateur. Relisez-les puis transmettez-les vous-même à votre équipe par votre canal habituel.</p>
          </div> : <form onSubmit={submit} aria-labelledby="settings-assistance-title" className="space-y-3">
            <p id="settings-assistance-hint">Décrivez votre demande sans mot de passe ni donnée confidentielle. Aucun envoi automatique. Le brouillon disparaît si vous quittez cet onglet ou rechargez la page.</p>
            <label className="block" htmlFor="settings-assistance-message">Votre message</label>
            <textarea ref={messageInput} id="settings-assistance-message" required maxLength={MAX_ASSISTANCE_MESSAGE} rows={6}
              aria-describedby="settings-assistance-hint settings-assistance-count"
              className="w-full rounded border border-[#d8d2ca] p-3" value={message}
              onChange={(event) => { setMessage(event.target.value); setError(""); setStatus(""); }} />
            <p id="settings-assistance-count" className="text-sm">{message.length} / {MAX_ASSISTANCE_MESSAGE} caractères</p>
            <button className={buttonClass} type="submit">Télécharger la demande</button>
          </form>}
          {error ? <p role="alert" className="text-red-700">{error}</p> : null}
          <button type="button" className={buttonClass} onClick={() => setKind(null)}>Fermer</button>
        </> : null}
      </dialog>

      <section className="space-y-2" aria-labelledby="settings-diagnostic-title">
        <h3 id="settings-diagnostic-title" className="font-semibold">Diagnostic local</h3>
        <p>Contient uniquement le nom de ce module, la date, les familles estimées du navigateur et du système, et la disponibilité des URL de téléchargement. Ce ne sont pas des logs serveur ni un contrôle de disponibilité.</p>
        <p>Aucun profil, session, cookie, stockage, adresse de page ou journal n’est lu ni ajouté. Aucune donnée n’est transmise.</p>
        <button type="button" className={buttonClass} onClick={downloadDiagnostic}>Télécharger le diagnostic local</button>
      </section>
      {!kind && error ? <p role="alert" className="text-red-700">{error}</p> : null}
      {status ? <p role="status" className="text-green-800">{status}</p> : null}
    </section>
  );
}
