"use client";
import { RefreshButton, RetryButton } from "@mairie360/lib-components/primitives";

import { navigateToLogin } from '@/lib/logout';

export interface SettingsNoticesProps {
  error: string;
  errorDetails: string[];
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

/** Alerts above the settings tabs (save refusal with details, read failure, logout failure) and the one recovery action. */
export const SettingsNotices = ({ error, errorDetails, readError, logoutError, recoverable, hasData, reading, saving, onReload }: SettingsNoticesProps) => (
  <>
    {error ? (
      <div role="alert" className={alertClass}>
        <p>{error}</p>
        {errorDetails.length ? <ul className="mt-2 list-disc pl-5 text-sm">{errorDetails.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
      </div>
    ) : null}
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
