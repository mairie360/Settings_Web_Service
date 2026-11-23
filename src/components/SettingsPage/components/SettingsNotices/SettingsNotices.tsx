"use client";
import { RefreshButton, RetryButton } from "@mairie360/lib-components/primitives";

import { navigateToLogin } from '@/lib/logout';

export interface SettingsNoticesProps {
  readError: string;
  logoutError: string;
  /** A recovery read is offered (no data yet, an unavailable source, or a failed read). */
  recoverable: boolean;
  hasData: boolean;
  reading: boolean;
  saving: boolean;
  onReload: () => void;
}

const alertClass = "settings-notice rounded-md border-l-4 border-[var(--mairie-error-text)] bg-[var(--mairie-error-surface)] p-4 text-[var(--mairie-error-text)]";

/** Alerts above the settings tabs (read failure, logout failure) and the one recovery action; save refusals are toasts (MAIR-864). */
export const SettingsNotices = ({ readError, logoutError, recoverable, hasData, reading, saving, onReload }: SettingsNoticesProps) => (
  <>
    {readError ? <p role="alert" className={alertClass}>{readError}</p> : null}
    {logoutError ? <section role="alert" className={`${alertClass} space-y-2`}>
      <p>{logoutError}</p>
      <button type="button" className="rounded border px-4 py-2 text-sm font-medium" onClick={() => navigateToLogin({ explicit: true })}>Retour à la connexion</button>
    </section> : null}
    {recoverable ? (hasData
      ? <RefreshButton label={reading ? "Chargement…" : "Actualiser les paramètres"} variant="outline" tone="neutral" disabled={reading || saving} loading={reading} onClick={onReload} className="settings-reload" />
      : <RetryButton label={reading ? "Chargement…" : "Réessayer"} variant="outline" tone="neutral" disabled={reading || saving} loading={reading} onClick={onReload} className="settings-reload" />) : null}
  </>
);
