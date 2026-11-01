"use client";
import type { ReactNode } from "react";
import { Help, SectionTitle } from "@mairie360/lib-components/primitives";

export interface SettingsSectionProps {
  title: ReactNode;
  /** Id of the heading, when another element points to it. */
  titleId?: string;
  description?: ReactNode;
  busy?: boolean;
  className?: string;
  children?: ReactNode;
  "aria-labelledby"?: string;
}

/** One card of a settings tab (Figma « SettingsSection »): h2, optional description, content. */
export default function SettingsSection({ title, titleId, description, busy, className = "", children, ...aria }: SettingsSectionProps) {
  return (
    <section className={`settings-feature-card ${className}`.trim()} aria-busy={busy || undefined} {...aria}>
      <SectionTitle id={titleId}>{title}</SectionTitle>
      {description ? <Help className="settings-section-description">{description}</Help> : null}
      {children}
    </section>
  );
}
