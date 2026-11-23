"use client";
import { Alert, Panel } from "@mairie360/lib-components/primitives";

export interface SettingsLoadingProps {
  reading: boolean;
  failed: boolean;
  /** Explicit recovery read (« Réessayer »). */
  onRetry: () => void;
}

/**
 * Before any confirmed profile (MAIR-851, Figma « Chargement » and « Profil indisponible »):
 * the loading panel while the first read runs, then a warning with « Réessayer » when it failed.
 */
export const SettingsLoading = ({ reading, failed, onRetry }: SettingsLoadingProps) => (
  !reading && failed
    ? <Alert tone="warning" role="alert" title="Profil temporairement indisponible"
      description="Vos paramètres n’ont pas pu être chargés. Vérifiez votre connexion puis réessayez."
      actionLabel="Réessayer" onAction={onRetry} className="settings-unavailable" />
    : <Panel title="Chargement des paramètres…" state="loading" className="settings-loading" />
);
