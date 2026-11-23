"use client";
import { useEffect, useState } from "react";
import { Button, Modal, OneTimeCodeField } from "@mairie360/lib-components/primitives";

import { regenerateBackupCodes } from '@/lib/settings-api';

export interface RegenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onRegenerated: (codes: string[]) => void;
}

/** Parcours S3 « Régénérer les codes de secours »: a code of the application replaces the ten codes. */
export const RegenerateDialog = ({ open, onClose, onRegenerated }: RegenerateDialogProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) { setCode(""); setError(""); } }, [open]);

  async function submit() {
    if (!/^\d{6}$/.test(code)) { setError("Saisissez le code à 6 chiffres."); return; }
    setBusy(true); setError("");
    try { onRegenerated((await regenerateBackupCodes(code)).backup_codes); }
    catch { setError("Code incorrect."); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Régénérer les codes de secours" size="s"
      description="Les codes actuels ne fonctionneront plus. Saisissez un code de votre application d’authentification."
      footer={<>
        <Button variant="outline" tone="neutral" onClick={onClose}>Annuler</Button>
        <Button onClick={() => void submit()} loading={busy} disabled={busy}>Régénérer</Button>
      </>}>
      <OneTimeCodeField kind="totp" label="Code de l’application" error={error || undefined} onValueChange={(value) => { setCode(value); setError(""); }} />
    </Modal>
  );
};
