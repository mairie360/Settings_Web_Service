import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferencesPanel from './PreferencesPanel';
import * as api from '@/lib/settings-api';
import fixtures from '@tests/support/settings-fixtures.cjs';

vi.mock('@/lib/settings-api', () => ({ saveAppearance: vi.fn(), saveGeneral: vi.fn(), saveNotifications: vi.fn() }));

const props = (overrides = {}) => ({ bootstrap: fixtures.bootstrap(), reading: false, onWriting: vi.fn(), onRefresh: vi.fn(), onNotify: vi.fn(), onFailure: vi.fn(), ...overrides });
const notifications = fixtures.notifications();

describe('PreferencesPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves a switch at once and reports the receipt; a refusal brings it back with « Enregistrement impossible. »', async () => {
    const user = userEvent.setup();
    const onNotify = vi.fn(); const onFailure = vi.fn();
    api.saveNotifications.mockResolvedValueOnce({ ...notifications, push: true }).mockRejectedValueOnce(new Error('refused'));
    render(<PreferencesPanel tab="notifications" {...props({ onNotify, onFailure })} />);
    const push = screen.getByRole('switch', { name: 'Notifications push' });
    await user.click(push);
    expect(api.saveNotifications).toHaveBeenCalledWith({ push: true });
    expect(onNotify).toHaveBeenCalledWith('Option activée — Notifications push');
    await user.click(screen.getByRole('switch', { name: 'Notifications push' }));
    expect(onFailure).toHaveBeenCalledWith('Enregistrement impossible.');
    expect(screen.getByRole('switch', { name: 'Notifications push' }).getAttribute('aria-checked')).toBe('true');
  });

  it('shows « Préférences indisponibles » with « Réessayer » when the section could not be read', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(<PreferencesPanel tab="appearance" {...props({ onRefresh, bootstrap: fixtures.bootstrap({ sources: { preferences: 'unavailable' } }) })} />);
    expect(screen.getByRole('alert').textContent).toMatch(/Préférences indisponibles/);
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('renders nothing outside the three preference tabs', () => {
    const { container } = render(<PreferencesPanel tab="profile" {...props()} />);
    expect(container.innerHTML).toBe('');
  });
});
