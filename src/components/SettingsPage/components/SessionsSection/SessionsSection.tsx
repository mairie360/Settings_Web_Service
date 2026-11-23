"use client";
import { useRef, useState } from "react";
import { Button, ConfirmModal, Panel, SessionList } from "@mairie360/lib-components/primitives";
import { History, LogOut, MonitorSmartphone } from "lucide-react";

import type { SettingsBootstrapRead as Bootstrap } from '@/lib/settings-bootstrap';
import * as api from '@/lib/settings-api';
import { BffRequestError } from '@/lib/bff-client';
import SessionRevokeDialog from './components/SessionRevokeDialog';

type Session = Bootstrap['sessions'][number];

export interface SessionsSectionProps {
  data: Bootstrap;
  /** Replaces the sessions and the history with what BFF_Settings read again after a revocation. */
  onSessions: (sessions: Session[], history: Session[]) => void;
  onNotify: (message: string) => void;
  onFailure: (message: string) => void;
}

const isActive = (session: Session) => !session.revoked_at && Date.parse(session.expires_at) > Date.now();

/** French reason of a refused revocation (404 already ended, 409 the session of this page). */
export function revokeFailure(error: unknown) {
  if (error instanceof BffRequestError && error.status === 404) return 'Cette session est déjà terminée.';
  if (error instanceof BffRequestError && error.status === 409) return 'Pour fermer cette session, déconnectez-vous.';
  return 'La déconnexion n’a pas été confirmée.';
}

/**
 * The Sessions tab (MAIR-892): the active sessions (lib SessionList, « Cet appareil » never revocable), one session
 * ended after a confirmation, « Déconnecter les autres appareils », and the history of the ended sessions.
 */
export const SessionsSection = ({ data, onSessions, onNotify, onFailure }: SessionsSectionProps) => {
  const [sessionToRevoke, setSessionToRevoke] = useState<{ id: string; device_info: string } | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const writing = useRef(false);
  const current = data.current_session_id ?? null;
  const sessions = data.sources.sessions === "unavailable" ? null : data.sessions;
  const others = (sessions ?? []).filter(session => session.id !== current && isActive(session));
  const historyAvailable = data.sources.session_history !== "unavailable" && Array.isArray(data.session_history);

  const revokeOthers = async () => {
    if (writing.current) return;
    writing.current = true; setRevokingOthers(true);
    try {
      const result = await api.revokeOtherSessions();
      onSessions(result.sessions, result.session_history);
      onNotify(result.revoked === 1 ? '1 autre session a été déconnectée.' : `${result.revoked} autres sessions ont été déconnectées.`);
      setConfirmOthers(false);
    } catch (error) {
      onFailure(revokeFailure(error));
    } finally { writing.current = false; setRevokingOthers(false); }
  };

  return (
    <div className="space-y-5">
      <Panel icon={MonitorSmartphone} title="Sessions actives" description="Les appareils connectés à votre compte." className="settings-sessions"
        action={<Button variant="outline" tone="danger" icon={LogOut} disabled={!others.length || revokingOthers} onClick={() => setConfirmOthers(true)}>
          Déconnecter les autres appareils
        </Button>}>
        <SessionList
          sessions={sessions}
          currentSessionId={current}
          caption="Sessions actives"
          unavailableTitle="Les sessions sont temporairement indisponibles."
          emptyTitle="Aucune session à afficher."
          onRevoke={(session) => setSessionToRevoke({ id: session.id, device_info: session.device_info })}
        />
      </Panel>
      <Panel icon={History} title="Historique des connexions" description="Les sessions terminées ou expirées de votre compte." className="settings-session-history">
        <SessionList
          sessions={historyAvailable ? data.session_history! : null}
          caption="Historique des connexions"
          dateColumnLabel="Fin"
          unavailableTitle="L’historique est temporairement indisponible."
          emptyTitle="Aucune session terminée."
        />
      </Panel>
      {sessionToRevoke ? (
        <SessionRevokeDialog session={sessionToRevoke}
          port={{ revokeSession: async (id) => { try { const result = await api.revokeSession(id); onSessions(result.sessions, result.session_history); } catch (error) { throw new Error(revokeFailure(error)); } } }}
          onClose={() => setSessionToRevoke(null)}
          onRevoked={() => { onNotify(`Session « ${sessionToRevoke.device_info} » déconnectée.`); setSessionToRevoke(null); }} />
      ) : null}
      <ConfirmModal open={confirmOthers} title="Déconnecter les autres appareils ?"
        message={`${others.length === 1 ? 'L’autre session sera fermée' : `Les ${others.length} autres sessions seront fermées`}. Cet appareil reste connecté.`}
        confirmLabel={revokingOthers ? 'Déconnexion…' : 'Déconnecter'} cancelLabel="Annuler" busy={revokingOthers}
        onConfirm={() => void revokeOthers()} onCancel={() => { if (!revokingOthers) setConfirmOthers(false); }} />
    </div>
  );
};
