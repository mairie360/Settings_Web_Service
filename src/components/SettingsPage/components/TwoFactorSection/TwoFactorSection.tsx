"use client";
import { ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, Help, InfoAlert, Panel, StatusPill } from "@mairie360/lib-components/primitives";

import { loadTwoFactor } from '@/lib/settings-api';
import type { SettingsTwoFactorStatus } from '@/lib/settings-api';
import { EnableDialog } from './components/EnableDialog';
import { BackupCodesDialog } from './components/BackupCodesDialog';
import { RegenerateDialog } from './components/RegenerateDialog';
import { DisableDialog } from './components/DisableDialog';

export interface TwoFactorSectionProps {
  /** Receipts of the section, shown by the page as toasts. */
  onNotify: (message: string) => void;
  /** Called with the status each time it is read (the page header shows it, MAIR-1125). */
  onStatus?: (enabled: boolean) => void;
}

type Dialog = "enable" | "regenerate" | "disable" | null;

/**
 * « Double authentification » of the Security tab (MAIR-807, parcours S2 / S3): status from BFF_Settings, activation
 * (QR code + first code, then the ten backup codes shown once), regeneration of the codes and deactivation. When the
 * mairie imposes the second factor, Core refuses the deactivation (403): the section then says so and hides the action.
 */
export const TwoFactorSection = ({ onNotify, onStatus }: TwoFactorSectionProps) => {
  const [status, setStatus] = useState<SettingsTwoFactorStatus | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [codesReceipt, setCodesReceipt] = useState("");
  const [imposed, setImposed] = useState(false);

  const read = useCallback(async () => {
    setState("loading");
    try { const received = await loadTwoFactor(); setStatus(received); setState("ready"); onStatus?.(received.enabled); }
    catch { setState("unavailable"); }
  }, [onStatus]);
  useEffect(() => { void read(); }, [read]);

  const showCodes = (received: string[], receipt: string) => { setDialog(null); setCodes(received); setCodesReceipt(receipt); };
  const finishCodes = () => { setCodes(null); onNotify(codesReceipt); void read(); };

  // The dialogs stay outside the Panel: it replaces its children by its loading / empty / unavailable state.
  return (<>
    <Panel icon={ShieldCheck} title="Double authentification"
      description="Un code de votre application d’authentification vous est demandé à chaque connexion, en plus du mot de passe."
      state={state === "ready" ? "default" : state} stateProps={{ onRetry: () => void read(), title: state === "unavailable" ? "Double authentification indisponible" : undefined }}
      className="settings-two-factor">
      {status ? (
        <div className="space-y-3">
          <StatusPill label={status.enabled ? "Activée" : "Désactivée"} tone={status.enabled ? "success" : "neutral"} dot />
          {status.enabled ? <Help>Codes de secours restants : {status.backup_codes_remaining} sur 10</Help> : null}
          {imposed ? <InfoAlert title="Votre mairie impose la double authentification." /> : null}
          <div className="flex flex-wrap gap-2">
            {status.enabled ? <>
              <Button variant="outline" tone="neutral" onClick={() => setDialog("regenerate")}>Régénérer les codes de secours</Button>
              {imposed ? null : <Button variant="outline" tone="danger" onClick={() => setDialog("disable")}>Désactiver</Button>}
            </> : <Button onClick={() => setDialog("enable")}>Activer</Button>}
          </div>
        </div>
      ) : null}
    </Panel>
      <EnableDialog open={dialog === "enable"} onClose={() => setDialog(null)} onEnabled={(received) => showCodes(received, "Double authentification activée.")} />
      <RegenerateDialog open={dialog === "regenerate"} onClose={() => setDialog(null)} onRegenerated={(received) => showCodes(received, "Nouveaux codes de secours enregistrés.")} />
      <DisableDialog open={dialog === "disable"} onClose={() => setDialog(null)}
        onDisabled={() => { setDialog(null); onNotify("Double authentification désactivée."); void read(); }}
        onImposed={() => { setDialog(null); setImposed(true); }} />
      <BackupCodesDialog codes={codes} onDone={finishCodes} />
  </>);
};
