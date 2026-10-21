"use client";
import { safeFontFamily } from "@mairie360/lib-components/theme";
import type { SettingsAppearance } from "@mairie360/bff-settings-openapi/model";

/** Bounded preview of the appearance draft (12–24 px); the shared reading size of the interface stays. */
export const AppearancePreview = ({ appearance }: { appearance: SettingsAppearance }) => (
  <>
    <div aria-label="Aperçu de l’apparence" data-preview-theme={appearance.theme ?? "system"} className="mairie-appearance-preview mt-4 rounded border" style={{ colorScheme: appearance.theme === "system" || appearance.theme === null ? "light dark" : appearance.theme, fontFamily: safeFontFamily(appearance.font_family), fontSize: appearance.font_size === null ? undefined : Math.min(24, Math.max(12, appearance.font_size)), padding: appearance.density === "compact" ? 8 : appearance.density === "comfortable" ? 24 : 16 }}><strong>Aperçu</strong><p>Votre environnement Mairie360</p></div>
    <p className="mt-2 text-sm">La taille de cet aperçu est limitée entre 12 et 24 px. La taille de lecture commune de l’interface reste conservée.</p>
  </>
);
