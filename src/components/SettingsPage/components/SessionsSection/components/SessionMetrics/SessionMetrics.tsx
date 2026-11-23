"use client";
import { MetricCard } from "@mairie360/lib-components/primitives";
import { Clock, Globe, LogOut, MonitorSmartphone } from "lucide-react";

export interface SessionMetricsProps {
  /** `null` when the sessions or the history could not be read. */
  active: number | null;
  others: number | null;
  history: number | null;
}

const shown = (value: number | null) => (value === null ? "—" : String(value));

/**
 * The four indicators of the Sessions tab (MAIR-1126, C15), recalculated after every revocation. The approximate
 * location of this device is not in the BFF_Settings contract yet: the card says so.
 */
export const SessionMetrics = ({ active, others, history }: SessionMetricsProps) => (
  <div className="settings-session-metrics grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <MetricCard layout="inline" icon={MonitorSmartphone} label="Sessions actives" value={shown(active)} />
    <MetricCard layout="inline" icon={LogOut} iconTone="module" iconColor="var(--mairie-warning-text)" label="Autres appareils connectés" value={shown(others)} />
    <MetricCard layout="inline" icon={Clock} label="Sessions dans l’historique" value={shown(history)} />
    <MetricCard layout="inline" icon={Globe} label="Localisation de cet appareil" value="Non disponible" />
  </div>
);
