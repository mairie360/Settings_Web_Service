"use client";

import { useEffect, useRef, useState } from 'react';
import { pendingFeatureMessage, pendingSettingsPort } from '@/lib/settings-features';
import type { SettingsFeaturePort } from '@/lib/settings-features';

export default function SessionRevokeControl({ sessionId, label, port = pendingSettingsPort, onRevoked }: {
  sessionId: string; label: string; port?: SettingsFeaturePort; onRevoked?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const writing = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  return <div className="mt-3 space-y-2">
    {!confirming ? <button type="button" className="rounded border px-3 py-2" onClick={() => setConfirming(true)}>Déconnecter cette session</button> : <>
      <p>Déconnecter la session « {label} » ?</p>
      <button type="button" disabled={pending} className="mr-2 rounded border px-3 py-2" onClick={async () => {
        if (writing.current) return; setError('');
        if (!port.revokeSession) { setError(pendingFeatureMessage); return; }
        writing.current = true; setPending(true);
        try { await port.revokeSession(sessionId); if (alive.current) { setConfirming(false); onRevoked?.(); } }
        catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : 'La déconnexion n’a pas été confirmée.'); }
        finally { writing.current = false; if (alive.current) setPending(false); }
      }}>{pending ? 'Déconnexion…' : 'Confirmer la déconnexion'}</button>
      <button type="button" disabled={pending} className="rounded border px-3 py-2" onClick={() => { setConfirming(false); setError(''); }}>Annuler</button>
    </>}{error ? <p role="alert">{error}</p> : null}
  </div>;
}
