"use client";
import { useState } from "react";
import { PasswordField, SaveButton, SectionTitle } from "@mairie360/lib-components/primitives";

import { validatePassword } from "@/lib/settings-features";
import SettingsMutationForm from "../shared/SettingsMutationForm";

export interface PasswordFormProps {
  busy: boolean;
  /** Clears the fields when leaving the Security tab (passwords live only in memory). */
  epoch: number;
  onInvalid: (message: string) => void;
  onSubmit: (current: string, next: string, done: () => void) => void;
  children?: React.ReactNode;
}

const fields = [["current", "Mot de passe actuel"], ["next", "Nouveau mot de passe"], ["confirmation", "Confirmer le mot de passe"]] as const;

/** The password change card of the Security tab. */
export const PasswordForm = ({ busy, epoch, onInvalid, onSubmit, children }: PasswordFormProps) => {
  const [passwords, setPasswords] = useState({ current: "", next: "", confirmation: "" });
  const [cleared, setCleared] = useState(epoch);
  if (cleared !== epoch) { setCleared(epoch); setPasswords({ current: "", next: "", confirmation: "" }); }
  return (
    <SettingsMutationForm className="settings-feature-card" data-form="password" onSubmit={event => {
      event.preventDefault();
      const error = validatePassword(passwords.current, passwords.next, passwords.confirmation);
      if (error) { onInvalid(error); return; }
      onSubmit(passwords.current, passwords.next, () => setPasswords({ current: "", next: "", confirmation: "" }));
    }}>
      <SectionTitle>Mot de passe</SectionTitle>
      <div className="mt-4 space-y-3">
        {fields.map(([key, label]) => (
          <PasswordField key={key} name={key} id={`settings-password-${key}`} label={label} required autoComplete={key === "current" ? "current-password" : "new-password"} disabled={busy} value={passwords[key]} onChange={event => setPasswords(current => ({ ...current, [key]: event.target.value }))} />
        ))}
      </div>
      <SaveButton type="submit" label="Changer le mot de passe" variant="outline" tone="neutral" className="mt-4" disabled={busy} />
      {children}
    </SettingsMutationForm>
  );
};
