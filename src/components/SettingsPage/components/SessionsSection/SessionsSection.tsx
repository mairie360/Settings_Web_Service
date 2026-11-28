"use client";
import { useRef, useState } from "react";
import { Button, ConfirmModal, Panel, SegmentedControl, SessionList } from "@mairie360/lib-components/primitives";
import { Clock, LogOut, MonitorSmartphone } from "lucide-react";

import type { SettingsBootstrapRead as Bootstrap } from '@/lib/settings-bootstrap';
import * as api from '@/lib/settings-api';
import { BffRequestError } from '@/lib/bff-client';
import SessionRevokeDialog from './components/SessionRevokeDialog';
import { SessionMetrics } from './components/SessionMetrics';
import { SessionDetailDialog } from './components/SessionDetailDialog';
import { sessionDeviceLabel } from './session-device';

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
 * ended after a confirmation, « Déconnecter les autres appareils », and the history of the ended sessions behind the
 * « Actives (n) » / « Historique (n) » switch of the same panel (MAIR-1258).
 */
export const SessionsSection = ({ data, onSessions, onNotify, onFailure }: SessionsSectionProps) => {
  const [sessionToRevoke, setSessionToRevoke] = useState<{ id: string; device_info: string } | null>(null);
  const [selected, setSelected] = useState<Session | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const [view, setView] = useState<"active" | "history">("active");
  const [revokingOthers, setRevokingOthers] = useState(false);
  const writing = useRef(false);
  const current = data.current_session_id ?? null;
  const sessions = data.sources.sessions === "unavailable" ? null : data.sessions;
  const others = (sessions ?? []).filter(session => session.id !== current && isActive(session));
  const historyAvailable = data.sources.session_history !== "unavailable" && Array.isArray(data.session_history);
  const active = sessions === null ? null : sessions.filter(isActive).length;
  const historyCount = historyAvailable ? data.session_history!.length : null;

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
      <SessionMetrics active={active} others={sessions === null ? null : others.length} history={historyCount} />
      {/* MAIR-1258: one « Sessions » panel as in the artifact, « Actives (n) » / « Historique (n) » switch the list; each
          count is the number of rows its list shows. */}
      <Panel icon={MonitorSmartphone} title="Sessions" className="settings-sessions"
        description="Appareils connectés à votre compte. Si vous ne reconnaissez pas une session, déconnectez-la puis changez votre mot de passe."
        action={<Button variant="outline" tone="danger" icon={LogOut} disabled={!others.length || revokingOthers} onClick={() => setConfirmOthers(true)}>
          Déconnecter les autres appareils
        </Button>}>
        <div className="space-y-4">
          <SegmentedControl label="Filtrer les sessions" value={view} onChange={setView}
            options={[
              { key: "active", label: sessions === null ? "Actives" : `Actives (${sessions.length})`, icon: MonitorSmartphone },
              { key: "history", label: historyCount === null ? "Historique" : `Historique (${historyCount})`, icon: Clock },
            ]} />
          {view === "active" ? (
            <SessionList
              sessions={sessions}
              currentSessionId={current}
              caption="Sessions actives"
              // MAIR-1258 (artifact): « Firefox 132 · Windows » and the session id under it.
              deviceLabel={sessionDeviceLabel}
              showIds
              unavailableTitle="Les sessions sont temporairement indisponibles."
              emptyTitle="Aucune session à afficher."
              onRevoke={(session) => setSessionToRevoke({ id: session.id, device_info: sessionDeviceLabel(session) })}
              onSelect={(session) => setSelected(session as Session)}
            />
          ) : (
            <SessionList
              sessions={historyAvailable ? data.session_history! : null}
              caption="Historique des sessions"
              deviceLabel={sessionDeviceLabel}
              showIds
              dateColumnLabel="Fin"
              unavailableTitle="L’historique est temporairement indisponible."
              emptyTitle="Aucune session passée."
            />
          )}
        </div>
      </Panel>
      <SessionDetailDialog session={selected} current={selected?.id === current} revocable={selected ? isActive(selected) : false}
        onClose={() => setSelected(null)} onRevoke={(session) => setSessionToRevoke({ id: session.id, device_info: sessionDeviceLabel(session) })} />
      {sessionToRevoke ? (
        <SessionRevokeDialog session={sessionToRevoke}
          port={{ revokeSession: async (id) => { try { const result = await api.revokeSession(id); onSessions(result.sessions, result.session_history); } catch (error) { throw new Error(revokeFailure(error)); } } }}
          onClose={() => setSessionToRevoke(null)}
          onRevoked={() => { onNotify(`Session « ${sessionToRevoke.device_info} » déconnectée.`); setSessionToRevoke(null); setSelected(null); }} />
      ) : null}
      <ConfirmModal open={confirmOthers} title="Déconnecter les autres appareils ?"
        message={`${others.length === 1 ? 'L’autre session sera fermée' : `Les ${others.length} autres sessions seront fermées`}. Cet appareil reste connecté.`}
        confirmLabel={revokingOthers ? 'Déconnexion…' : 'Déconnecter'} cancelLabel="Annuler" busy={revokingOthers}
        onConfirm={() => void revokeOthers()} onCancel={() => { if (!revokingOthers) setConfirmOthers(false); }} />
    </div>
  );
};
