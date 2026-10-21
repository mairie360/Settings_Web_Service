"use client";
import { DownloadButton, PanelTitle } from "@mairie360/lib-components/primitives";

/** The local diagnostic export card. */
export const DiagnosticSection = ({ onDownload }: { onDownload: () => void }) => (
  <section className="space-y-2" aria-labelledby="settings-diagnostic-title">
    <PanelTitle id="settings-diagnostic-title">Diagnostic local</PanelTitle>
    <p>Contient uniquement le nom de ce module, la date, les familles estimées du navigateur et du système, et la disponibilité des URL de téléchargement. Ce ne sont pas des logs serveur ni un contrôle de disponibilité.</p>
    <p>Aucun profil, session, cookie, stockage, adresse de page ou journal n’est lu ni ajouté. Aucune donnée n’est transmise.</p>
    <DownloadButton label="Télécharger le diagnostic local" variant="outline" tone="neutral" onClick={onDownload} />
  </section>
);
