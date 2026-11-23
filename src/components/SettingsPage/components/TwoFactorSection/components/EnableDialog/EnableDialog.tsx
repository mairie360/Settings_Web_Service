"use client";
import { useEffect, useState } from "react";
import { Alert, Button, CopyField, Modal, OneTimeCodeField, QrCode, Spinner, Text } from "@mairie360/lib-components/primitives";

import { confirmTwoFactor, startTwoFactor } from '@/lib/settings-api';
import type { SettingsTwoFactorSetup } from '@/lib/settings-api';

export interface EnableDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the ten backup codes once the first code activated the factor. */
  onEnabled: (codes: string[]) => void;
}

export const CODE_REQUIRED = "Saisissez le code à 6 chiffres.";
export const CODE_REFUSED = "Code incorrect. Vérifiez que l’heure de votre téléphone est juste, puis saisissez le nouveau code.";

/** Step 1 of parcours S2: the QR code and key of a new secret, then the first code of the application. « Annuler » drops the pending secret. */
export const EnableDialog = ({ open, onClose, onEnabled }: EnableDialogProps) => {
  const [setup, setSetup] = useState<SettingsTwoFactorSetup | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) { setSetup(null); setCode(""); setError(""); setFailed(false); return; }
    let alive = true;
    startTwoFactor().then((received) => { if (alive) setSetup(received); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [open]);

  async function submit() {
    if (!/^\d{6}$/.test(code)) { setError(CODE_REQUIRED); return; }
    setBusy(true); setError("");
    try { onEnabled((await confirmTwoFactor(code)).backup_codes); }
    catch { setError(CODE_REFUSED); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Activer la double authentification" size="m"
      description="Scannez le QR code avec votre application d’authentification, puis saisissez le code qu’elle affiche."
      footer={<>
        <Button variant="outline" tone="neutral" onClick={onClose}>Annuler</Button>
        <Button onClick={() => void submit()} loading={busy} disabled={!setup || busy}>Vérifier le code</Button>
      </>}>
      {failed ? <Alert tone="danger" role="alert" title="La double authentification ne peut pas être activée pour le moment." description="Réessayez plus tard." />
        : !setup ? <Spinner label="Préparation du QR code…" />
          : <div className="space-y-4">
            <QrCode value={setup.otpauth_uri} label="QR code à scanner avec votre application d’authentification" />
            <Text>Vous ne pouvez pas scanner ? Saisissez cette clé dans l’application :</Text>
            <CopyField label="Clé à recopier" value={setup.secret} />
            <OneTimeCodeField kind="totp" label="Code de l’application" error={error || undefined} onValueChange={(value) => { setCode(value); setError(""); }} />
          </div>}
    </Modal>
  );
};
