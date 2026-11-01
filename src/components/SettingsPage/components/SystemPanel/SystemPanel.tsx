"use client";
import { useState } from "react";
import { Button, ErrorText } from "@mairie360/lib-components/primitives";

import { diagnosticFile, downloadLocalFile } from '@/lib/local-assistance';
import SettingsSection from '../SettingsSection';
import { FeedbackToast } from '../FeedbackToast';
import BrowserInformation from './components/BrowserInformation';
import { DiagnosticSection } from './components/DiagnosticSection';
import { AssistanceDialog, useAssistanceDialog } from './components/AssistanceDialog';

/** « Système et assistance » (Figma 06 Système): browser information, help centre, local support drafts and diagnostic export. */
export default function SystemPanel() {
  const [status, setStatus] = useState("");
  const dialog = useAssistanceDialog(setStatus);
  const [diagnosticError, setDiagnosticError] = useState("");
  function downloadDiagnostic() {
    setStatus(""); setDiagnosticError(""); dialog.setError("");
    try {
      downloadLocalFile(diagnosticFile(navigator.userAgent, typeof URL.createObjectURL === "function"));
      setStatus("Téléchargement du diagnostic local lancé. Aucun fichier n’a été envoyé.");
    } catch {
      setDiagnosticError("Le diagnostic local n’a pas pu être préparé. Réessayez avec un navigateur autorisant les téléchargements.");
    }
  }
  const openers = [["help", "Centre d’aide"], ["support", "Préparer une demande de support"], ["report", "Signaler un problème"]] as const;
  return (
    <SettingsSection title="Système et assistance" className="space-y-5">
      <p>La version déployée, sa date de mise à jour et l’espace de stockage ne sont pas fournis par le service.</p>
      <BrowserInformation />
      <div className="flex flex-wrap gap-3">
        {openers.map(([kind, label]) => (
          <Button key={kind} variant="outline" tone="neutral" label={label} aria-haspopup="dialog" aria-expanded={dialog.kind === kind} aria-controls="settings-assistance-dialog" onClick={(event) => dialog.prepare(kind, event)} />
        ))}
      </div>
      <AssistanceDialog {...dialog} onStatus={setStatus} />
      <DiagnosticSection onDownload={downloadDiagnostic} />
      {!dialog.kind && (dialog.error || diagnosticError) ? <ErrorText role="alert">{dialog.error || diagnosticError}</ErrorText> : null}
      <FeedbackToast message={status} tone="info" onClose={() => setStatus("")} />
    </SettingsSection>
  );
}
