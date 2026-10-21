"use client";
import { SelectField } from "@mairie360/lib-components/primitives";

export interface PreferenceSelectProps {
  label: string;
  value: string | boolean | null;
  options: readonly (readonly [string, string])[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

/** A preference select where « Par défaut » keeps the account behaviour; an unknown current value stays selectable. */
export const PreferenceSelect = ({ label, value, options, disabled, onChange }: PreferenceSelectProps) => {
  const current = value === null ? "" : String(value);
  const known = options.some(([option]) => option === current);
  return (
    <SelectField label={label} className="mt-4" disabled={disabled} value={current} placeholder="Par défaut"
      options={[...(current && !known ? [{ value: current, label: current }] : []), ...options.map(([option, text]) => ({ value: option, label: text }))]}
      onChange={(next) => onChange(next)} />
  );
};
