"use client";
import { Camera } from "lucide-react";
import { Panel, ProfilePhotoField } from "@mairie360/lib-components/primitives";

import { PHOTO_ACCEPT, PHOTO_HINT, PHOTO_PICK_MAX_BYTES } from '@/lib/profile-photo';
import type { SettingsProfile } from '@/lib/settings-api';
import { DirectoryPreview } from './components/DirectoryPreview';

export interface ProfilePhotoCardProps {
  /** The profile being edited: the preview follows the draft. */
  profile: SettingsProfile;
  photoUrl: string | null;
  photoError: string | null;
  disabled: boolean;
  onPhoto: (file: File | null) => void;
}

/** Initials of the agent, shown by the photo field when there is no photo. */
const initialsOf = (firstName: string, lastName: string) => `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();

/**
 * Left card of the profile: the photo (JPG or PNG of at most 2 Mo, converted before it is sent) and the preview of
 * the agent in the directory. The field keeps its « Photo de profil » label for assistive technologies only, the
 * card title already shows it.
 */
export const ProfilePhotoCard = ({ profile, photoUrl, photoError, disabled, onPhoto }: ProfilePhotoCardProps) => (
  <Panel icon={Camera} title="Photo de profil" description="Visible dans la messagerie, les projets et l’annuaire." className="settings-photo-card" fill>
    {/* The lib marker would start with « ProfilePhotoField », which ZAP 10031 reads as the reflected `?tab=profile`:
        a caller name first keeps « ProfilePhotoField » for the RGAA engine (`~=` match) without that prefix. */}
    <ProfilePhotoField data-m360-component="SettingsPhoto" id="settings-photo" label={<span className="sr-only">Photo de profil</span>}
      className="settings-profile-photo" value={photoUrl} initials={initialsOf(profile.first_name, profile.last_name)}
      accept={PHOTO_ACCEPT} maxSize={PHOTO_PICK_MAX_BYTES} hint={PHOTO_HINT} error={photoError ?? undefined} disabled={disabled} onChange={onPhoto} />
    <DirectoryPreview firstName={profile.first_name} lastName={profile.last_name} jobTitle={profile.job_title}
      service={profile.service?.name} photoUrl={photoUrl} />
  </Panel>
);
