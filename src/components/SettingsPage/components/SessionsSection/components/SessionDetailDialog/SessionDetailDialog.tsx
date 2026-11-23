"use client";
import { Button, CloseButton, Modal, SessionDetails } from "@mairie360/lib-components/primitives";
import { LogOut } from "lucide-react";

import type { SettingsBootstrapRead as Bootstrap } from '@/lib/settings-bootstrap';

type Session = Bootstrap['sessions'][number];

export interface SessionDetailDialogProps {
  session: Session | null;
  /** The session of this page: « Session en cours », never disconnected from here. */
  current: boolean;
  /** Whether the session can still be ended (active and not this device). */
  revocable: boolean;
  onClose: () => void;
  /** Opens the confirmation above the detail (MAIR-1126, C16). */
  onRevoke: (session: Session) => void;
}

/** Detail of one session in a centred window (MAIR-1126, C16), opened from a row of the list. */
export const SessionDetailDialog = ({ session, current, revocable, onClose, onRevoke }: SessionDetailDialogProps) => (
  <Modal open={Boolean(session)} title="Détail de la session" onClose={onClose} size="m"
    footerEnd={<>
      <CloseButton label="Fermer" onClick={onClose} />
      {session && revocable && !current
        ? <Button tone="danger" icon={LogOut} onClick={() => onRevoke(session)}>Déconnecter cette session</Button>
        : null}
    </>}>
    {session ? <SessionDetails session={session} current={current} /> : null}
  </Modal>
);
