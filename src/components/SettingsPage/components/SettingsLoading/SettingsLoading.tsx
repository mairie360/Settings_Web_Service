"use client";
import { Skeleton } from "@mairie360/lib-components/primitives";

/** Before any confirmed profile: status line and a skeleton card (Figma 07 « Chargement », 08 « Profil indisponible »). */
export const SettingsLoading = ({ reading, failed }: { reading: boolean; failed: boolean }) => (
  <div aria-busy={reading}><p>{!reading && failed ? "Le profil est indisponible." : "Chargement des paramètres…"}</p>{reading ? <Skeleton.Card className="mt-4" /> : null}</div>
);
