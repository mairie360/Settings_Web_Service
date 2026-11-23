"use client";
import { useEffect, useState } from "react";
import { Button, Checkbox, Modal, RecoveryCodes, WarningAlert } from "@mairie360/lib-components/primitives";

export interface BackupCodesDialogProps {
  /** The ten codes to show once; the dialog is closed while `null`. */
  codes: string[] | null;
  onDone: () => void;
}

/**
 * Step 2 of parcours S2 (and the end of the regeneration, S3): the codes are shown once, with copy and download; « Terminer »
 * waits for the confirmation that they were saved. No « Annuler »: the factor (or the new codes) is already active.
 */
export const BackupCodesDialog = ({ codes, onDone }: BackupCodesDialogProps) => {
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (codes) setSaved(false); }, [codes]);
  return (
    <Modal open={Boolean(codes)} onClose={() => { if (saved) onDone(); }} title="Codes de secours" size="m"
      description="Chaque code permet de vous connecter une seule fois si vous n’avez plus votre téléphone."
      footer={<Button onClick={onDone} disabled={!saved}>Terminer</Button>}>
      <div className="space-y-4">
        <WarningAlert title="Ces codes ne seront plus affichés." description="Copiez-les ou téléchargez-les et gardez-les en lieu sûr." />
        <RecoveryCodes codes={codes ?? []} />
        <Checkbox label="J’ai enregistré mes codes de secours en lieu sûr." checked={saved} onChange={(event) => setSaved(event.target.checked)} />
      </div>
    </Modal>
  );
};
