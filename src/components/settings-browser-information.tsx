"use client";

import { useSyncExternalStore } from "react";
import { deviceFamilies } from "@/lib/local-assistance";

// These local labels have no events or persistent state. Stable string snapshots
// avoid object identity loops; the server snapshot never reads navigator.
const subscribe = () => () => {};
const serverLabel = () => "Identification après chargement";
function localLabel(field: "browser" | "operatingSystem") {
  try {
    return deviceFamilies(navigator.userAgent)[field];
  } catch {
    return "Indisponible";
  }
}
const browserLabel = () => localLabel("browser");
const operatingSystemLabel = () => localLabel("operatingSystem");

export default function SettingsBrowserInformation() {
  const browser = useSyncExternalStore(subscribe, browserLabel, serverLabel);
  const operatingSystem = useSyncExternalStore(subscribe, operatingSystemLabel, serverLabel);

  return (
    <section className="space-y-3" aria-labelledby="settings-browser-information-title">
      <h3 id="settings-browser-information-title" className="font-semibold">Informations du navigateur actuel</h3>
      <p className="text-sm text-[#596274]">Familles estimées localement, sans numéro de version ni inventaire de votre appareil. Aucune donnée n’est transmise.</p>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-[#596274]">Navigateur</dt>
          <dd className="font-medium">{browser}</dd>
        </div>
        <div>
          <dt className="text-sm text-[#596274]">Système d’exploitation</dt>
          <dd className="font-medium">{operatingSystem}</dd>
        </div>
      </dl>
    </section>
  );
}
