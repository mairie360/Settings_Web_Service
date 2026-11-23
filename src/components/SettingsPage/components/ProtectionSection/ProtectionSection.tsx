"use client";
import { Body, Button, Help, IconChip, Panel, ProgressMeter, StatusPill } from "@mairie360/lib-components/primitives";
import { MonitorSmartphone, ShieldCheck } from "lucide-react";

export interface ProtectionSectionProps {
  /** Second factor of the account, `null` while unknown. */
  twoFactorEnabled: boolean | null;
  /** Sign-in alerts by e-mail (`null` = the account default, off). */
  loginAlerts: boolean | null | undefined;
  /** Active sessions, `null` when they could not be read. */
  activeSessions: number | null;
  onManageSessions: () => void;
}

export const MAX_ACTIVE_SESSIONS = 3;

/** The three criteria of the score (MAIR-1127, C19): second factor, sign-in alerts, at most three active sessions. */
export function protectionScore({ twoFactorEnabled, loginAlerts, activeSessions }: Omit<ProtectionSectionProps, 'onManageSessions'>) {
  return [twoFactorEnabled === true, loginAlerts === true, activeSessions !== null && activeSessions <= MAX_ACTIVE_SESSIONS].filter(Boolean).length;
}

const verdicts = [
  { label: "À renforcer", tone: "danger" },
  { label: "À renforcer", tone: "danger" },
  { label: "Correct", tone: "warning" },
  { label: "Bien protégé", tone: "success" },
] as const;

/**
 * « Protection du compte » of the Security tab (MAIR-1127, C19 / C20): a score out of three recalculated as the
 * settings change, then the connected devices with « Gérer », which opens the Sessions tab.
 */
export const ProtectionSection = (props: ProtectionSectionProps) => {
  const score = protectionScore(props);
  const verdict = verdicts[score];
  const sessions = props.activeSessions;
  return (
    <Panel icon={ShieldCheck} title="Protection du compte" description="Trois réglages protègent votre compte." className="settings-protection"
      action={<StatusPill label={verdict.label} tone={verdict.tone} dot />}>
      <div className="space-y-4">
        <ProgressMeter label={`Score de protection : ${score} sur 3`} value={Math.round((score / 3) * 100)} tone={verdict.tone} showValue={false} />
        <Help>Double authentification activée, alertes de connexion activées, au plus {MAX_ACTIVE_SESSIONS} sessions actives.</Help>
        <div className="flex flex-wrap items-center gap-3">
          <IconChip icon={MonitorSmartphone} />
          <Body className="min-w-0 flex-1">
            {sessions === null ? "Sessions momentanément indisponibles."
              : `${sessions} session${sessions > 1 ? "s" : ""} active${sessions > 1 ? "s" : ""} sur vos appareils`}
          </Body>
          <Button variant="outline" tone="neutral" onClick={props.onManageSessions}>Gérer</Button>
        </div>
      </div>
    </Panel>
  );
};
