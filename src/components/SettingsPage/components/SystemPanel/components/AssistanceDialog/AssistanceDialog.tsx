"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import { CloseButton, DownloadButton, ErrorText, Help, SectionTitle, TextArea } from "@mairie360/lib-components/primitives";

import { assistanceFile, downloadLocalFile, MAX_ASSISTANCE_MESSAGE } from '@/lib/local-assistance';
import type { AssistanceKind } from '@/lib/local-assistance';
import SettingsMutationForm from '@/components/SettingsPage/components/SettingsMutationForm';

export type AssistanceDialogKind = AssistanceKind | "help";

/** Prepares the dialog state of the assistance section: which kind is open, draft message, errors and the opener. */
export function useAssistanceDialog(onStatus: (status: string) => void) {
  const [kind, setKind] = useState<AssistanceDialogKind | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement | null>(null);
  function prepare(next: AssistanceDialogKind, event: MouseEvent<HTMLButtonElement>) {
    trigger.current = event.currentTarget;
    setKind(next); setMessage(""); setError(""); onStatus("");
  }
  return { kind, setKind, message, setMessage, error, setError, trigger, prepare };
}

export interface AssistanceDialogProps extends ReturnType<typeof useAssistanceDialog> {
  onStatus: (status: string) => void;
}

/** The native dialog of the help centre and the local support / report drafts (nothing is sent). */
export const AssistanceDialog = ({ kind, setKind, message, setMessage, error, setError, trigger, onStatus }: AssistanceDialogProps) => {
  const dialog = useRef<HTMLDialogElement>(null);
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
    onStatus(""); setError("");
    if (!message.trim() || message.length > MAX_ASSISTANCE_MESSAGE) { setError("Décrivez votre demande en 1 à 5 000 caractères non vides."); return; }
    try {
      downloadLocalFile(assistanceFile(kind, message));
      setKind(null);
      onStatus("Téléchargement de la demande lancé. Aucun message n’a été envoyé.");
    } catch {
      setError("Le fichier n’a pas pu être préparé. Votre message est conservé ; vous pouvez le copier ou réessayer.");
    }
  }
  return (
    <dialog ref={dialog} id="settings-assistance-dialog" className="settings-assistance-dialog" aria-labelledby="settings-assistance-title"
      onKeyDown={keepDialogFocus} onCancel={() => setKind(null)}
      onClose={() => { if (!dialog.current?.open) { setKind(null); trigger.current?.focus(); } }}>
      {kind ? <>
        <SectionTitle as="h3" ref={heading} id="settings-assistance-title" tabIndex={-1}>{kind === "help" ? "Centre d’aide" : kind === "support" ? "Demande de support" : "Signalement"}</SectionTitle>
        {kind === "help" ? <div className="space-y-2">
          <p>Dans Profil, modifiez vos coordonnées puis choisissez « Enregistrer ». La confirmation apparaît après la réponse du service.</p>
          <p>Dans Sécurité, consultez les sessions disponibles. Cette page ne permet pas encore de les révoquer ni de changer votre mot de passe.</p>
          <p>Dans Notifications, Apparence et Général, préparez vos préférences. Leur enregistrement dans le compte reste indisponible.</p>
          <p>Les fichiers ci-dessous sont préparés dans votre navigateur. Relisez-les puis transmettez-les vous-même à votre équipe par votre canal habituel.</p>
        </div> : <SettingsMutationForm data-form="assistance" onSubmit={submit} aria-labelledby="settings-assistance-title" className="space-y-3">
          <Help id="settings-assistance-hint">Décrivez votre demande sans mot de passe ni donnée confidentielle. Aucun envoi automatique. Le brouillon disparaît si vous quittez cet onglet ou rechargez la page.</Help>
          <TextArea ref={messageInput} id="settings-assistance-message" label="Votre message" required maxLength={MAX_ASSISTANCE_MESSAGE} rows={6} aria-describedby="settings-assistance-hint settings-assistance-count" value={message} onChange={(event) => { setMessage(event.target.value); setError(""); onStatus(""); }} />
          <Help id="settings-assistance-count">{message.length} / {MAX_ASSISTANCE_MESSAGE} caractères</Help>
          <DownloadButton type="submit" label="Télécharger la demande" variant="outline" tone="neutral" />
        </SettingsMutationForm>}
        {error ? <ErrorText role="alert">{error}</ErrorText> : null}
        <CloseButton label="Fermer" onClick={() => setKind(null)} />
      </> : null}
    </dialog>
  );
};
