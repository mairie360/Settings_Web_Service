"use client";
import { Overline, UserIdentity } from "@mairie360/lib-components/primitives";

export interface DirectoryPreviewProps {
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  service?: string | null;
  photoUrl?: string | null;
}

/** « Fonction · Service » line of the directory card; an agent without a function reads « Agent », as in the artifact. */
export const directoryRole = (jobTitle?: string | null, service?: string | null) =>
  [jobTitle?.trim() || "Agent", service?.trim()].filter(Boolean).join(" · ");

/** « Aperçu dans l’annuaire »: how the other agents see the identity being edited (avatar, name, function and service). */
export const DirectoryPreview = ({ firstName, lastName, jobTitle, service, photoUrl }: DirectoryPreviewProps) => {
  const name = `${firstName} ${lastName}`.trim();
  return (
    <div className="settings-directory-preview">
      <Overline as="p">Aperçu dans l’annuaire</Overline>
      <UserIdentity className="settings-directory-card" data-testid="settings-directory-card" size="l"
        name={name} email={directoryRole(jobTitle, service)} avatarSrc={photoUrl ?? undefined} />
    </div>
  );
};
