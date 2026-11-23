import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingsHero, activeSessions, enabledNotifications } from './SettingsHero';
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
    expect(screen.getByText('anne.le-gall@mairie.test')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Double authentification : Activée' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nombre de sessions actives : 2' })).toBeTruthy();
    // Fixture: e-mail, messages, projects and system updates on; push and calendar off.
    expect(screen.getByRole('button', { name: 'Notifications : 4 activées' })).toBeTruthy();
  });

  it('opens the tab a tile summarises, and shows « — » for what is unknown', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<SettingsHero data={data({ sources: { sessions: 'unavailable', notifications: 'unavailable' } })} twoFactorEnabled={null} onOpen={onOpen} />);
    expect(screen.getByRole('button', { name: 'Double authentification : —' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Nombre de sessions actives : inconnu' }));
    await user.click(screen.getByRole('button', { name: 'Notifications : —' }));
    await user.click(screen.getByRole('button', { name: 'Double authentification : —' }));
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

  it('counts `null` notifications as on (the account default)', () => {
    expect(enabledNotifications(data({ notifications: null }))).toBe(6);
    expect(activeSessions(data({ sessions: [] }))).toBe(0);
  });
});
