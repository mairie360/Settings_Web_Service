import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoginAlertsSection } from './LoginAlertsSection';
import * as api from '@/lib/settings-api';
import fixtures from '@tests/support/settings-fixtures.cjs';

vi.mock('@/lib/settings-api', () => ({ saveNotifications: vi.fn() }));

describe('LoginAlertsSection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves the switch at once and hands the confirmed settings to the page', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn(); const onNotify = vi.fn();
    const saved = fixtures.notifications({ login_alerts: true });
    api.saveNotifications.mockResolvedValue(saved);
    render(<LoginAlertsSection enabled={null} disabled={false} onSaved={onSaved} onNotify={onNotify} onFailure={vi.fn()} />);
    const toggle = screen.getByRole('switch', { name: 'M’alerter par e-mail à chaque nouvelle connexion' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    await user.click(toggle);
    expect(api.saveNotifications).toHaveBeenCalledWith({ login_alerts: true });
    expect(onSaved).toHaveBeenCalledWith(saved);
    expect(onNotify).toHaveBeenCalledWith('Alertes de connexion activées.');
  });

  it('brings the switch back when the save is refused or not confirmed', async () => {
    const user = userEvent.setup();
    const onFailure = vi.fn(); const onSaved = vi.fn();
    api.saveNotifications.mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce({ login_alerts: 'yes' });
    render(<LoginAlertsSection enabled={true} disabled={false} onSaved={onSaved} onNotify={vi.fn()} onFailure={onFailure} />);
    const toggle = () => screen.getByRole('switch', { name: 'M’alerter par e-mail à chaque nouvelle connexion' });
    await user.click(toggle());
    await waitFor(() => expect(toggle().getAttribute('aria-checked')).toBe('true'));
    await user.click(toggle());
    await waitFor(() => expect(onFailure).toHaveBeenCalledTimes(2));
    expect(onFailure).toHaveBeenCalledWith('Enregistrement impossible.');
    expect(onSaved).not.toHaveBeenCalled();
  });
});
