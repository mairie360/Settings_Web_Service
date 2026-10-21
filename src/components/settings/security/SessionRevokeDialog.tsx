"use client";

import { useEffect, useRef, useState } from 'react';
import { ConfirmModal } from '@mairie360/lib-components/primitives';
import { pendingFeatureMessage, pendingSettingsPort } from '@/lib/settings-features';
import type { SettingsFeaturePort } from '@/lib/settings-features';

/**
 * MAIR-607: the row action of the shared SessionList only opens this confirmation;
 * the session is revoked through the feature port once the agent confirms.
 */
export default function SessionRevokeDialog({ session, port = pendingSettingsPort, onRevoked, onClose }: {
  session: { id: string; device_info: string }; port?: SettingsFeaturePort; onRevoked?: (id: string) => void; onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const writing = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const confirm = async () => {
    if (writing.current) return;
    setError('');
    if (!port.revokeSession) { setError(pendingFeatureMessage); return; }
    writing.current = true; setPending(true);
    try { await port.revokeSession(session.id); if (alive.current) onRevoked?.(session.id); }
    catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : 'La déconnexion n’a pas été confirmée.'); }
    finally { writing.current = false; if (alive.current) setPending(false); }
  };
  const message = error || `La session « ${session.device_info} » sera fermée sur cet appareil.`;
  return <div className="settings-session-revoke">
    <ConfirmModal open title="Déconnecter cette session ?" message={message} confirmLabel={pending ? 'Déconnexion…' : 'Confirmer la déconnexion'} cancelLabel="Annuler" busy={pending} onConfirm={() => void confirm()} onCancel={() => { if (!pending) onClose(); }} />
    <p role="alert" className="sr-only">{error}</p>
  </div>;
}
