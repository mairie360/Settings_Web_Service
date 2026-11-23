"use client";
import { useEffect, useState } from "react";
import { Button, ErrorAlert, Modal, TextField } from "@mairie360/lib-components/primitives";

import { passkeyOptions, registerPasskey } from '@/lib/settings-api';
import type { SettingsPasskey } from '@/lib/settings-api';
import { BffRequestError } from '@/lib/bff-client';
import { createPasskeyCredential, isCancellation } from '@/lib/webauthn';

export interface AddPasskeyDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: (passkey: SettingsPasskey) => void;
  /** The mairie does not accept passkeys (403). */
  onRefused: () => void;
}

const LABEL_MAX = 100;

/** Parcours S4 « Ajouter une passkey »: a name, then the browser creates the passkey and BFF_Settings registers it. */
export const AddPasskeyDialog = ({ open, onClose, onAdded, onRefused }: AddPasskeyDialogProps) => {
  const [label, setLabel] = useState("");
  const [labelError, setLabelError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) { setLabel(""); setLabelError(""); setError(""); } }, [open]);

  async function create() {
    const name = label.trim();
    if (!name) { setLabelError("Donnez un nom à cette passkey."); return; }
    if (/[<>]/.test(name)) { setLabelError("Le nom ne doit pas contenir < ni >."); return; }
    setBusy(true); setError("");
    try {
      const { options } = await passkeyOptions();
      const credential = await createPasskeyCredential(options);
      onAdded(await registerPasskey({ label: name, credential }));
    } catch (reason) {
      if (isCancellation(reason)) return;
      if (reason instanceof BffRequestError && reason.status === 403) { onRefused(); return; }
      setError(reason instanceof BffRequestError && reason.status === 409 ? "Cette passkey est déjà enregistrée sur votre compte." : "La passkey n’a pas pu être créée. Réessayez.");
    } finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une passkey" size="s"
      description="Votre navigateur va vous demander de confirmer avec l’empreinte, le visage ou le code de votre appareil."
      footer={<>
        <Button variant="outline" tone="neutral" onClick={onClose}>Annuler</Button>
        <Button onClick={() => void create()} loading={busy} disabled={busy}>Créer la passkey</Button>
      </>}>
      <div className="space-y-4">
        {error ? <ErrorAlert title={error} /> : null}
        <TextField label="Nom de la passkey" hint="Pour la reconnaître dans la liste, par exemple « Ordinateur de la mairie »." maxLength={LABEL_MAX}
          required value={label} error={labelError || undefined} onChange={(event) => { setLabel(event.target.value); setLabelError(""); }} />
      </div>
    </Modal>
  );
};
