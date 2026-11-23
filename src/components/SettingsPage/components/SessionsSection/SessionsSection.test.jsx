import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SessionsSection, revokeFailure } from './SessionsSection';
import * as api from '@/lib/settings-api';
import { BffRequestError } from '@/lib/bff-client';
import fixtures from '@tests/support/settings-fixtures.cjs';

vi.mock('@/lib/settings-api', () => ({ revokeSession: vi.fn(), revokeOtherSessions: vi.fn() }));

const future = new Date(Date.now() + 86_400_000).toISOString();
const data = (overrides = {}) => fixtures.bootstrap({
  sessions: [fixtures.session('s-1', { expires_at: future }), fixtures.session('s-2', { device_info: 'Safari sur iPhone', expires_at: future })],
  ...overrides,
});
const props = (overrides = {}) => ({ data: data(), onSessions: vi.fn(), onNotify: vi.fn(), onFailure: vi.fn(), ...overrides });

describe('SessionsSection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks this device, never revocable, and lists the ended sessions in the history', () => {
    render(<SessionsSection {...props()} />);
    expect(screen.getByRole('heading', { name: 'Sessions actives' })).toBeTruthy();
    const active = screen.getByRole('table', { name: 'Sessions actives' });
    expect(within(active).getByText('Cet appareil')).toBeTruthy();
    expect(within(active).getAllByRole('button', { name: /Déconnecter/ })).toHaveLength(1);
    expect(within(screen.getByRole('table', { name: 'Historique des connexions' })).getByText('Chrome sur Windows')).toBeTruthy();
  });

  it('ends another session after the confirmation and replaces the lists with the answer', async () => {
    const user = userEvent.setup();
    const onSessions = vi.fn(); const onNotify = vi.fn();
    api.revokeSession.mockResolvedValue({ sessions: [fixtures.session('s-1')], session_history: [fixtures.session('s-2')] });
    render(<SessionsSection {...props({ onSessions, onNotify })} />);
    await user.click(within(screen.getByRole('table', { name: 'Sessions actives' })).getByRole('button', { name: /Déconnecter/ }));
    expect(api.revokeSession).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirmer la déconnexion' }));
    expect(api.revokeSession).toHaveBeenCalledWith('s-2');
    expect(onSessions).toHaveBeenCalledWith([fixtures.session('s-1')], [fixtures.session('s-2')]);
    expect(onNotify).toHaveBeenCalledWith('Session « Safari sur iPhone » déconnectée.');
  });

  it('keeps the dialog open with the French reason when the revocation is refused', async () => {
    const user = userEvent.setup();
    api.revokeSession.mockRejectedValue(new BffRequestError('gone', 404, null));
    render(<SessionsSection {...props()} />);
    await user.click(within(screen.getByRole('table', { name: 'Sessions actives' })).getByRole('button', { name: /Déconnecter/ }));
    await user.click(screen.getByRole('button', { name: 'Confirmer la déconnexion' }));
    expect((await screen.findAllByText('Cette session est déjà terminée.')).length).toBeGreaterThan(0);
  });

  it('« Déconnecter les autres appareils » asks first, then reports how many sessions were ended', async () => {
    const user = userEvent.setup();
    const onSessions = vi.fn(); const onNotify = vi.fn(); const onFailure = vi.fn();
    api.revokeOtherSessions.mockRejectedValueOnce(new Error('down')).mockResolvedValue({ sessions: [fixtures.session('s-1')], session_history: [], revoked: 1 });
    render(<SessionsSection {...props({ onSessions, onNotify, onFailure })} />);
    await user.click(screen.getByRole('button', { name: 'Déconnecter les autres appareils' }));
    expect(screen.getByText('L’autre session sera fermée. Cet appareil reste connecté.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Déconnecter' }));
    expect(onFailure).toHaveBeenCalledWith('La déconnexion n’a pas été confirmée.');
    await user.click(screen.getByRole('button', { name: 'Déconnecter' }));
    expect(onNotify).toHaveBeenCalledWith('1 autre session a été déconnectée.');
    expect(onSessions).toHaveBeenCalledWith([fixtures.session('s-1')], []);
  });

  it('shows both unavailable states and offers no « autres appareils » without another active session', () => {
    render(<SessionsSection {...props({ data: data({ sessions: [], session_history: undefined, sources: { sessions: 'unavailable', session_history: 'unavailable' } }) })} />);
    expect(screen.getByText('Les sessions sont temporairement indisponibles.')).toBeTruthy();
    expect(screen.getByText('L’historique est temporairement indisponible.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Déconnecter les autres appareils' }).disabled).toBe(true);
  });

  it('explains every refusal in French', () => {
    expect(revokeFailure(new BffRequestError('x', 409, null))).toBe('Pour fermer cette session, déconnectez-vous.');
    expect(revokeFailure(new Error('x'))).toBe('La déconnexion n’a pas été confirmée.');
  });
});
