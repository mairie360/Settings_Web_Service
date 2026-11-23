"use client";
import { KeyRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConfirmModal, CreatePasskeyButton, DataTable, DateTime, DeleteButton, Panel, Text } from "@mairie360/lib-components/primitives";

import { deletePasskey, loadPasskeys } from '@/lib/settings-api';
import type { SettingsPasskey } from '@/lib/settings-api';
import { BffRequestError } from '@/lib/bff-client';
import { isWebAuthnSupported } from '@/lib/webauthn';
import { AddPasskeyDialog } from './components/AddPasskeyDialog';

export interface PasskeysSectionProps {
  onNotify: (message: string) => void;
  onFailure: (message: string) => void;
}

/**
 * « Passkeys » of the Security tab (MAIR-811, parcours S4): the agent's passkeys (name, manager, dates), « Créer une passkey »
 * (name, then the browser ceremony) and deletion after confirmation. When the mairie does not accept passkeys (403), the section
 * says so; a browser without WebAuthn cannot add one.
 */
export const PasskeysSection = ({ onNotify, onFailure }: PasskeysSectionProps) => {
  const [passkeys, setPasskeys] = useState<SettingsPasskey[] | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [adding, setAdding] = useState(false);
  const [refused, setRefused] = useState(false);
  const [removing, setRemoving] = useState<SettingsPasskey | null>(null);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(isWebAuthnSupported()); }, []);

  const read = useCallback(async () => {
    setState("loading");
    try { setPasskeys(await loadPasskeys()); setState("ready"); }
    catch { setState("unavailable"); }
  }, []);
  useEffect(() => { void read(); }, [read]);

  async function confirmRemoval() {
    if (!removing) return;
    setBusy(true);
    try {
      await deletePasskey(removing.id);
      onNotify(`Passkey « ${removing.label} » supprimée.`);
      setRemoving(null);
      void read();
    } catch (reason) {
      onFailure(reason instanceof BffRequestError && reason.status === 404 ? "Cette passkey n’existe plus." : "La passkey n’a pas pu être supprimée.");
      setRemoving(null);
      void read();
    } finally { setBusy(false); }
  }

  const rows = passkeys ?? [];
  // The dialogs stay outside the Panel: it replaces its children by its loading / empty / unavailable state.
  return (<>
    <Panel icon={KeyRound} title="Passkeys" className="settings-passkeys"
      description={<>
        Une passkey vous connecte sans mot de passe, avec l’empreinte, le visage ou le code de votre appareil.
        {/* In the description, not the content: the Panel replaces its content by the empty / unavailable state. */}
        {refused ? <Text tone="muted"> Votre mairie n’autorise pas les passkeys.</Text> : null}
        {!supported ? <Text tone="muted"> Ce navigateur ne permet pas de créer une passkey.</Text> : null}
      </>}
      action={supported && !refused && state === "ready" ? <CreatePasskeyButton onClick={() => setAdding(true)} /> : undefined}
      state={state === "ready" ? (rows.length ? "default" : "empty") : state}
      stateProps={{ onRetry: () => void read(), title: state === "ready" ? "Aucune passkey" : state === "unavailable" ? "Passkeys indisponibles" : undefined,
        description: state === "ready" ? "Ajoutez une passkey pour vous connecter sans mot de passe." : undefined }}>
      {rows.length ? (
        <DataTable<SettingsPasskey> label="Vos passkeys" rows={rows} rowKey={(passkey) => String(passkey.id)}
          columns={[
            { key: "label", header: "Nom", cell: (passkey) => passkey.label },
            { key: "provider", header: "Gestionnaire", cell: (passkey) => passkey.provider ?? "Inconnu" },
            { key: "created", header: "Ajoutée le", cell: (passkey) => <DateTime value={passkey.created_at} /> },
            { key: "used", header: "Dernière utilisation", cell: (passkey) => passkey.last_used_at ? <DateTime value={passkey.last_used_at} /> : "Jamais" },
            { key: "actions", header: "Actions", hideHeader: true, align: "end",
              cell: (passkey) => <DeleteButton size="s" variant="outline" label="Supprimer" aria-label={`Supprimer la passkey ${passkey.label}`} onClick={() => setRemoving(passkey)} /> },
          ]} />
      ) : null}
    </Panel>
      <AddPasskeyDialog open={adding} onClose={() => setAdding(false)}
        onAdded={(passkey) => { setAdding(false); onNotify(`Passkey « ${passkey.label} » ajoutée.`); void read(); }}
        onRefused={() => { setAdding(false); setRefused(true); }} />
      <ConfirmModal open={Boolean(removing)} destructive busy={busy} title="Supprimer cette passkey ?"
        message={removing ? `Vous ne pourrez plus vous connecter avec « ${removing.label} ».` : ""}
        confirmLabel="Supprimer" onCancel={() => setRemoving(null)} onConfirm={() => void confirmRemoval()} />
  </>);
};
