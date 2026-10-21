"use client";
import { useEffect, useRef, useState } from "react";
import { ErrorText, RefreshButton, SaveButton, SelectField } from "@mairie360/lib-components/primitives";

import { pendingFeatureMessage } from "@/lib/settings-features";
import type { InstanceUpdates, SettingsFeaturePort } from "@/lib/settings-features";
import SettingsMutationForm from "../shared/SettingsMutationForm";
import SettingsSection from "../shared/SettingsSection";
import { FeedbackToast } from "../shared/FeedbackToast";

/** Administrators only: deployed version, maintenance window, releases and the update policy, through the feature port. */
export default function InstanceUpdatesPanel({ port }: { port: SettingsFeaturePort }) {
  const [data, setData] = useState<InstanceUpdates | null>(null);
  const [policy, setPolicy] = useState<"automatic" | "pinned">("automatic");
  const [version, setVersion] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const alive = useRef(true);
  const [revision, setRevision] = useState(0);
  const [reading, setReading] = useState(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!port.loadUpdates) return;
    const controller = new AbortController(); setReading(true); setError("");
    void port.loadUpdates(controller.signal).then(next => {
      if (controller.signal.aborted) return;
      if (!next?.currentVersion || !next.maintenanceWindow || !Array.isArray(next.releases)) throw new Error("Les informations de mise à jour sont incohérentes.");
      setData(next); setPolicy(next.policy); setVersion(next.pinnedVersion ?? "");
    }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Lecture impossible."); }).finally(() => { if (!controller.signal.aborted) setReading(false); });
    return () => controller.abort();
  }, [port, revision]);
  return (
    <SettingsSection title="Mises à jour de l’instance">
      {!data ? <p>La version, la fenêtre de maintenance et les versions disponibles ne sont pas encore fournies.</p> : <>
        <p>Version actuelle : {data.currentVersion}</p><p>Fenêtre de maintenance : {data.maintenanceWindow}</p>
        {data.policy === "pinned" && data.releases.some(release => release.version === data.pinnedVersion && !release.supported) ? <p role="alert">La version épinglée n’est plus supportée. Choisissez une version prise en charge.</p> : null}
        <ul>{data.releases.map(release => <li className="mt-3 whitespace-pre-wrap" key={release.version}><strong>{release.version}</strong><p>{release.notes}</p></li>)}</ul>
      </>}
      {port.loadUpdates ? <RefreshButton label={reading ? "Chargement des versions…" : "Actualiser les versions"} variant="outline" tone="neutral" disabled={reading || busy} onClick={() => setRevision(value => value + 1)} /> : null}
      <SettingsMutationForm className="mt-4 space-y-3" data-form="instance-updates" onSubmit={async event => {
        event.preventDefault(); if (pending.current || reading) return; setError(""); setStatus("");
        if (!data || !port.saveUpdates) { setError(pendingFeatureMessage); return; }
        pending.current = true; setBusy(true);
        try { const next = await port.saveUpdates({ policy, ...(policy === "pinned" ? { version } : {}) }); if (!alive.current) return; if (!next?.currentVersion || !next.maintenanceWindow) throw new Error("La demande n’a pas été confirmée."); setData(next); setPolicy(next.policy); setVersion(next.pinnedVersion ?? ""); setStatus("Demande confirmée pour la prochaine fenêtre de maintenance."); }
        catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : "La demande n’a pas pu être enregistrée."); }
        finally { pending.current = false; if (alive.current) setBusy(false); }
      }}>
        <SelectField name="policy" label="Politique de mise à jour" value={policy} disabled={busy || reading} options={[{ value: "automatic", label: "Automatique" }, { value: "pinned", label: "Version épinglée" }]} onChange={value => setPolicy(value as typeof policy)} />
        {policy === "pinned" ? <SelectField name="version" label="Version à épingler" value={version} disabled={busy || reading || !data} required placeholder="Sélectionner une version" options={(data?.releases ?? []).map(release => ({ value: release.version, label: release.version, disabled: !release.supported }))} onChange={value => setVersion(value)} /> : null}
        <SaveButton type="submit" label={busy ? "Enregistrement…" : "Appliquer la politique"} variant="outline" tone="neutral" disabled={busy || reading} />
      </SettingsMutationForm>
      {error ? <ErrorText role="alert">{error}</ErrorText> : null}
      {status ? <FeedbackToast message={status} onClose={() => setStatus("")} /> : null}
    </SettingsSection>
  );
}
