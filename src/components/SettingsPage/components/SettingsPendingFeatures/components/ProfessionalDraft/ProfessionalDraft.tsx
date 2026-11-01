"use client";
import { BriefcaseBusiness } from "lucide-react";
import { Help, Icon, SaveButton, SectionTitle, StatusPill, TextArea, TextField } from "@mairie360/lib-components/primitives";

import { changedFields } from '@/lib/settings-features';
import type { ExtendedProfile } from '@/lib/settings-features';
import SettingsMutationForm from '@/components/SettingsPage/components/SettingsMutationForm';

export interface ProfessionalDraftProps {
  profile: ExtendedProfile;
  confirmedProfile: ExtendedProfile;
  busy: boolean;
  onChange: (profile: ExtendedProfile) => void;
  onSubmit: () => void;
  children?: React.ReactNode;
}

/** « Informations professionnelles »: a local draft until the account can store it (Figma 01 Profil, collapsed card). */
export const ProfessionalDraft = ({ profile, confirmedProfile, busy, onChange, onSubmit, children }: ProfessionalDraftProps) => {
  return (
    <section className="settings-feature-card settings-professional-card">
      <details>
        <summary>
          <SectionTitle className="settings-professional-heading"><Icon icon={BriefcaseBusiness} size="l" />Informations professionnelles<StatusPill label="Brouillon local" tone="info" size="s" className="settings-draft-badge" /></SectionTitle>
          <Help as="span" className="settings-section-description">Ces informations ne sont pas encore enregistrables dans votre compte.</Help>
        </summary>
        <SettingsMutationForm className="mt-5" data-form="professional" onSubmit={event => { event.preventDefault(); onSubmit(); }}>
          <Help>Brouillon conservé uniquement pendant cette visite.</Help>
          <div className="settings-profile-fields">
            {([["service", "Service"], ["position", "Poste"]] as const).map(([key, label]) => (
              <TextField key={key} name={key} label={label} value={profile[key]} disabled={busy} maxLength={200} onChange={event => onChange({ ...profile, [key]: event.target.value })} />
            ))}
          </div>
          <TextArea name="biography" label="Biographie" className="mt-4" rows={4} maxLength={5000} disabled={busy} value={profile.biography} onChange={event => onChange({ ...profile, biography: event.target.value })} />
          <SaveButton type="submit" label="Enregistrer les informations professionnelles" variant="outline" tone="neutral" className="mt-4" disabled={busy || !Object.keys(changedFields(confirmedProfile, profile)).length} />
          {children}
        </SettingsMutationForm>
      </details>
    </section>
  );
};
