"use client";

import { useSyncExternalStore } from "react";
import { Caption, PanelTitle, Help } from "@mairie360/lib-components/primitives";
import { deviceFamilies } from '@/lib/local-assistance';

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

/** Estimated browser and OS families, read locally after hydration (never transmitted). */
export default function BrowserInformation() {
  const browser = useSyncExternalStore(subscribe, browserLabel, serverLabel);
  const operatingSystem = useSyncExternalStore(subscribe, operatingSystemLabel, serverLabel);
  return (
    <section className="space-y-3" aria-labelledby="settings-browser-information-title">
      <PanelTitle id="settings-browser-information-title">Informations du navigateur actuel</PanelTitle>
      <Help>Familles estimées localement, sans numéro de version ni inventaire de votre appareil. Aucune donnée n’est transmise.</Help>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div><Caption as="dt">Navigateur</Caption><dd className="font-medium">{browser}</dd></div>
        <div><Caption as="dt">Système d’exploitation</Caption><dd className="font-medium">{operatingSystem}</dd></div>
      </dl>
    </section>
  );
}
