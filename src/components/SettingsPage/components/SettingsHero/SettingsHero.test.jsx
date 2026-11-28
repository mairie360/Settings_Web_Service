import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingsHero, activeSessions, enabledNotifications, heroSubtitle } from './SettingsHero';
import fixtures from '@tests/support/settings-fixtures.cjs';

const future = new Date(Date.now() + 86_400_000).toISOString();
const data = (overrides = {}) => fixtures.bootstrap({
  sessions: [fixtures.session('s-1', { expires_at: future }), fixtures.session('s-2', { expires_at: future }), fixtures.session('s-3', { revoked_at: '2026-09-16T08:00:00Z' })],
  ...overrides,
});

describe('SettingsHero', () => {
  it('names the agent and summarises the second factor, the active sessions and the notifications switched on', () => {
    render(<SettingsHero data={data()} twoFactorEnabled onOpen={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Anne Marie Le Gall' })).toBeTruthy();
    expect(screen.getByText('Paramètres du compte')).toBeTruthy();
    // « fonction · service · e-mail » under the name; no function reads « Agent », no service is left out.
    expect(screen.getByText('Agent · anne.le-gall@mairie.test')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Double authentification\s*Activée$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Sessions actives\s*2$/ })).toBeTruthy();
    // Fixture: e-mail, messages, projects and system updates on; push and calendar off.
    expect(screen.getByRole('button', { name: /^Notifications\s*4 activées$/ })).toBeTruthy();
  });

  it('opens the tab a tile summarises, and shows « — » for what is unknown', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<SettingsHero data={data({ sources: { sessions: 'unavailable', notifications: 'unavailable' } })} twoFactorEnabled={null} onOpen={onOpen} />);
    expect(screen.getByRole('button', { name: /^Double authentification\s*—$/ })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /^Sessions actives\s*—$/ }));
    await user.click(screen.getByRole('button', { name: /^Notifications\s*—$/ }));
    await user.click(screen.getByRole('button', { name: /^Double authentification\s*—$/ }));
    expect(onOpen.mock.calls.map(([tab]) => tab)).toEqual(['sessions', 'notifications', 'security']);
  });

  it('names no attribute after a tab key, so ZAP 10031 reads no reflected `?tab=` value', () => {
    const { container } = render(<SettingsHero data={data()} twoFactorEnabled onOpen={vi.fn()} />);
    const keys = ['profile', 'security', 'sessions', 'notification-preferences', 'appearance', 'general'];
    for (const element of container.querySelectorAll('*')) {
      for (const { name, value } of element.attributes) {
        expect(keys.some((key) => value.toLowerCase().startsWith(key)), `${name}="${value}"`).toBe(false);
      }
    }
  });

  it('MAIR-1227 names each tile by its visible text, with no aria-label (RGAA 11.9)', () => {
    const { container } = render(<SettingsHero data={data()} twoFactorEnabled onOpen={vi.fn()} />);
    const tiles = container.querySelectorAll('[data-m360-component="PageHeroStat"]');
    expect(tiles).toHaveLength(3);
    for (const tile of tiles) expect(tile.hasAttribute('aria-label')).toBe(false);
    expect([...tiles].map((tile) => tile.textContent)).toEqual(['Double authentificationActivée', 'Sessions actives2', 'Notifications4 activées']);
  });

  it('counts `null` notifications as on (the account default)', () => {
    expect(enabledNotifications(data({ notifications: null }))).toBe(6);
    expect(activeSessions(data({ sessions: [] }))).toBe(0);
  });

  it('MAIR-1258 shows the role, the service and the e-mail of the artifact under the name, and the stored photo', () => {
    const profile = fixtures.profile({ job_title: 'Cheffe de service', service: { id: 3, name: 'Voirie' } });
    expect(heroSubtitle(profile)).toBe('Cheffe de service · Voirie · anne.le-gall@mairie.test');
    expect(heroSubtitle(fixtures.profile({ job_title: '  ', service: { id: 3, name: 'Voirie' } }))).toBe('Agent · Voirie · anne.le-gall@mairie.test');
    const { container } = render(<SettingsHero data={data({ profile })} twoFactorEnabled onOpen={vi.fn()} photoUrl="blob:photo" />);
    expect(screen.getByText('Cheffe de service · Voirie · anne.le-gall@mairie.test')).toBeTruthy();
    expect(screen.getByText('Paramètres du compte')).toBeTruthy();
    expect(container.querySelector('img[src="blob:photo"]')).not.toBeNull();
  });
});
