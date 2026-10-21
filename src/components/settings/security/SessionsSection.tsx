"use client";
import { useState } from "react";
import { Help, SessionList } from "@mairie360/lib-components/primitives";

import type { SettingsBootstrapRead as Bootstrap } from "@/lib/settings-bootstrap";
import SettingsSection from "../shared/SettingsSection";
import SessionRevokeDialog from "./SessionRevokeDialog";

export interface SessionsSectionProps {
  data: Bootstrap;
  /** Marks the session revoked in the page data once the port confirmed it. */
  onRevoked: (id: string, revokedAt: string) => void;
}

/** The sessions card of the Security tab: the shared SessionList and its revoke confirmation (Figma 02 Sécurité). */
export const SessionsSection = ({ data, onRevoked }: SessionsSectionProps) => {
  const [sessionToRevoke, setSessionToRevoke] = useState<{ id: string; device_info: string } | null>(null);
  return (
    <SettingsSection title="Sessions" className="space-y-3">
      <SessionList
        sessions={data.sources.sessions === "unavailable" ? null : data.sessions}
        unavailableMessage="Les sessions sont temporairement indisponibles."
        emptyMessage="Aucune session à afficher."
        onRevoke={(session) => setSessionToRevoke({ id: session.id, device_info: session.device_info })}
      />
      {sessionToRevoke ? (
        <SessionRevokeDialog session={sessionToRevoke} onClose={() => setSessionToRevoke(null)} onRevoked={(id) => { onRevoked(id, new Date().toISOString()); setSessionToRevoke(null); }} />
      ) : null}
      <Help>L’identification de la session actuelle reste à raccorder.</Help>
    </SettingsSection>
  );
};
