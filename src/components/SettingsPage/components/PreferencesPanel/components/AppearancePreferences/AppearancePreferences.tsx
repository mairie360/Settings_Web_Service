"use client";
import { Palette } from "lucide-react";
import { useRef, useState } from 'react';
import { Panel, SegmentedControl, SelectField, Slider } from '@mairie360/lib-components/primitives';
import type { SettingsAppearance } from '@mairie360/bff-settings-openapi/model';
import { choices, defaults, FONT_SIZE, listValue } from '../../preferences';

export interface AppearancePreferencesProps {
  values: SettingsAppearance;
  disabled: boolean;
  save: (patch: Partial<SettingsAppearance>, receipt: string) => Promise<unknown>;
}

type Density = (typeof choices.density)[number]['value'];

/**
 * « Apparence » of the V2 mock-up (MAIR-912): font, text size and density save at once, with a toast. The theme is
 * not offered: the page is always light (MAIR-851). A refused value goes back to the confirmed one.
 */
export const AppearancePreferences = ({ values, disabled, save }: AppearancePreferencesProps) => {
  const confirmedSize = values.font_size ?? defaults.font_size;
  // The slider moves freely; the size is only sent once the agent lets go of it (pointer, keyboard or focus out).
  const [size, setSize] = useState<number | null>(null);
  const shownSize = size ?? confirmedSize;
  // The value being sent, so a focus out right after the release does not send it twice.
  const sending = useRef<number | null>(null);
  const commitSize = () => {
    if (size === null || size === sending.current) return;
    if (size === confirmedSize) { setSize(null); return; }
    sending.current = size;
    void save({ font_size: size }, `Taille du texte : ${size} px`).catch(() => undefined)
      .finally(() => { sending.current = null; setSize(null); });
  };
  const keep = (promise: Promise<unknown>) => { void promise.catch(() => undefined); };
  return <Panel icon={Palette} title="Apparence" description="Les changements s’appliquent immédiatement à toute l’interface." className="settings-appearance">
    <div className="space-y-5">
      <SelectField id="settings-font-family" label="Police de caractères" options={choices.font_family} placeholder={null} disabled={disabled}
        value={listValue('font_family', values.font_family)}
        onChange={(value) => keep(save({ font_family: value }, 'Police de caractères enregistrée'))} />
      <Slider id="settings-font-size" label="Taille du texte" min={FONT_SIZE.min} max={FONT_SIZE.max} step={1} disabled={disabled}
        value={Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, shownSize))} format={(value) => `${value} px`}
        onChange={setSize} onPointerUp={commitSize} onKeyUp={commitSize} onBlur={commitSize} />
      <SegmentedControl label="Densité de l’interface" options={choices.density.map(({ value, label }) => ({ key: value as Density, label, disabled }))} value={listValue('density', values.density) as Density}
        onChange={(value) => { if (!disabled) keep(save({ density: value }, 'Densité enregistrée')); }} />
    </div>
  </Panel>;
};
