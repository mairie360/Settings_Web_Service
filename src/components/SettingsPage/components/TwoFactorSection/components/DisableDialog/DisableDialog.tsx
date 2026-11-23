"use client";
import { useEffect, useState } from "react";
import { Button, ErrorAlert, Modal, OneTimeCodeField, PasswordField } from "@mairie360/lib-components/primitives";

import { disableTwoFactor } from '@/lib/settings-api';
import { BffRequestError } from '@/lib/bff-client';

export interface DisableDialogProps {
  open: boolean;
  onClose: () => void;
  onDisabled: () => void;
  /** Core refused: the mairie imposes the second factor (403). */
  onImposed: () => void;
}

/** Parcours S3 « Désactiver »: the password and a code of the application, in a lib window (never `confirm()`). */
export const DisableDialog = ({ open, onClose, onDisabled, onImposed }: DisableDialogProps) => {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) { setPassword(""); setCode(""); setError(""); } }, [open]);

  async function submit() {
    if (!password || !/^\d{6}$/.test(code)) { setError("Saisissez votre mot de passe et le code à 6 chiffres."); return; }
    setBusy(true); setError("");
    try { await disableTwoFactor({ password, code }); onDisabled(); }
    catch (reason) {
      if (reason instanceof BffRequestError && reason.status === 403) onImposed();
      else setError(reason instanceof BffRequestError && reason.status === 400 ? "Mot de passe ou code incorrect." : "La double authentification n’a pas pu être désactivée. Réessayez.");
    }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Désactiver la double authentification" size="s"
      description="Votre compte ne sera plus protégé que par votre mot de passe."
      footer={<>
        <Button variant="outline" tone="neutral" onClick={onClose}>Annuler</Button>
        <Button tone="danger" onClick={() => void submit()} loading={busy} disabled={busy}>Désactiver</Button>
      </>}>
      <div className="space-y-4">
        {error ? <ErrorAlert title={error} /> : null}
        <PasswordField label="Mot de passe" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} />
        <OneTimeCodeField kind="totp" label="Code de l’application" onValueChange={(value) => { setCode(value); setError(""); }} />
      </div>
    </Modal>
  );
};
