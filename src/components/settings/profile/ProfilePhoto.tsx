"use client";
import { useEffect, useState } from "react";
import { Avatar, CancelButton, Help, PanelTitle, SaveButton } from "@mairie360/lib-components/primitives";

import { validatePhoto } from "@/lib/settings-features";

export interface ProfilePhotoProps {
  initials: string;
  busy: boolean;
  /** The confirmed photo URL, when the feature port returned one. */
  confirmedPhoto: string;
  onInvalid: (message: string) => void;
  onPreview: () => void;
  onSave: (photo: File) => void;
}

/** Photo row of the profile card: avatar preview, file picker, save / clear (local preview only until a port exists). */
export const ProfilePhoto = ({ initials, busy, confirmedPhoto, onInvalid, onPreview, onSave }: ProfilePhotoProps) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  useEffect(() => {
    if (!photo) { setPhotoPreview(confirmedPhoto); return; }
    const url = URL.createObjectURL(photo); setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo, confirmedPhoto]);
  return (
    <section className="settings-photo-row" aria-labelledby="settings-photo-title">
      <Avatar className="settings-photo-avatar" src={photoPreview || undefined} alt="Aperçu de la photo sélectionnée" fallback={initials} size="xl" />
      <div className="settings-photo-controls">
        <PanelTitle id="settings-photo-title">Photo du profil</PanelTitle>
        <div className="settings-file-selection">
          <label className="settings-file-picker">Changer la photo<input type="file" name="photo" accept="image/jpeg,image/png" disabled={busy} className="sr-only" aria-describedby="settings-photo-help" onChange={event => {
            const file = event.target.files?.[0]; if (!file) return;
            const error = validatePhoto(file);
            if (error) { onInvalid(error); event.target.value = ""; return; }
            setPhoto(file); onPreview();
          }} /></label>
          <span className="settings-file-name">{photo?.name ?? "Aucun fichier choisi"}</span>
        </div>
        <Help id="settings-photo-help">JPG ou PNG, 2 Mo maximum.</Help>
        {photo ? <SaveButton label="Enregistrer la photo" variant="outline" tone="neutral" disabled={busy} onClick={() => { onSave(photo); }} /> : null}
        {photo ? <CancelButton label="Retirer l’aperçu" className="ml-2" disabled={busy} onClick={() => setPhoto(null)} /> : null}
        {/* The parent clears `photo` through `confirmedPhoto` after a confirmed save. */}
      </div>
    </section>
  );
};
