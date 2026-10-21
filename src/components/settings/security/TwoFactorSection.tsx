"use client";
import { ExternalLink } from "lucide-react";
import { Help, LinkButton } from "@mairie360/lib-components/primitives";

import SettingsSection from "../shared/SettingsSection";

/** Two-factor card: managed in the Keycloak account console when the instance has one (MAIR-357). */
export const TwoFactorSection = ({ twoFactorUrl }: { twoFactorUrl?: string }) => (
  <SettingsSection title="Double authentification" titleId="settings-two-factor-title" aria-labelledby="settings-two-factor-title">
    {twoFactorUrl ? <>
      <Help className="settings-section-description">Protégez votre compte avec un code généré par une application d’authentification ou avec une clé de sécurité. Ce réglage se gère dans votre compte unique ; le code vous sera ensuite demandé à chaque connexion avec le compte unique.</Help>
      <LinkButton href={twoFactorUrl} icon={ExternalLink} className="mt-3">Gérer ma double authentification</LinkButton>
    </> : <Help className="settings-section-description">La double authentification n’est pas disponible sur cette instance.</Help>}
  </SettingsSection>
);
