import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SessionsSection, revokeFailure } from './SessionsSection';
import { sessionDeviceLabel } from './session-device';
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

  it('marks this device, never revocable, and lists the ended sessions in the history', async () => {
    const user = userEvent.setup();
    render(<SessionsSection {...props()} />);
    expect(screen.getByRole('heading', { name: 'Sessions' })).toBeTruthy();
    const active = screen.getByRole('table', { name: 'Sessions actives' });
    expect(within(active).getByText('Cet appareil')).toBeTruthy();
    expect(within(active).getAllByRole('button', { name: /Déconnecter/ })).toHaveLength(1);
    await user.click(screen.getByRole('radio', { name: /Historique \(1\)/ }));
    expect(within(screen.getByRole('table', { name: 'Historique des sessions' })).getByText('Chrome sur Windows')).toBeTruthy();
  });

  it('MAIR-1258 one « Sessions » panel: the artifact text and the « Actives (n) » / « Historique (n) » switch', async () => {
    const user = userEvent.setup();
    render(<SessionsSection {...props()} />);
    expect(screen.getByText('Appareils connectés à votre compte. Si vous ne reconnaissez pas une session, déconnectez-la puis changez votre mot de passe.')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Historique des connexions' })).toBeNull();
    const switcher = screen.getByRole('radiogroup', { name: 'Filtrer les sessions' });
    expect(within(switcher).getAllByRole('radio').map((tab) => tab.textContent)).toEqual(['Actives (2)', 'Historique (1)']);
    expect(within(switcher).getByRole('radio', { name: /Actives/ }).getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByRole('table', { name: 'Historique des sessions' })).toBeNull();
    await user.click(within(switcher).getByRole('radio', { name: /Historique/ }));
    expect(screen.queryByRole('table', { name: 'Sessions actives' })).toBeNull();
    expect(screen.getByRole('table', { name: 'Historique des sessions' })).toBeTruthy();
    await user.click(within(switcher).getByRole('radio', { name: /Actives/ }));
    expect(screen.getByRole('table', { name: 'Sessions actives' })).toBeTruthy();
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

  it('shows both unavailable states and offers no « autres appareils » without another active session', async () => {
    const user = userEvent.setup();
    render(<SessionsSection {...props({ data: data({ sessions: [], session_history: undefined, sources: { sessions: 'unavailable', session_history: 'unavailable' } }) })} />);
    expect(screen.getByText('Les sessions sont temporairement indisponibles.')).toBeTruthy();
    // MAIR-1258: an unreadable list has no count in the switch.
    expect(screen.getAllByRole('radio').map((tab) => tab.textContent)).toEqual(['Actives', 'Historique']);
    await user.click(screen.getByRole('radio', { name: 'Historique' }));
    expect(screen.getByText('L’historique est temporairement indisponible.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Déconnecter les autres appareils' }).disabled).toBe(true);
  });

  it('MAIR-1126: counts the sessions in four cards and opens a row in a detail window, ending it after the confirmation', async () => {
    const user = userEvent.setup();
    const onSessions = vi.fn();
    api.revokeSession.mockResolvedValue({ sessions: [fixtures.session('s-1')], session_history: [fixtures.session('s-2')] });
    render(<SessionsSection {...props({ onSessions })} />);
    const card = (label) => screen.getAllByText(label).map((node) => node.closest('[data-m360-component~="MetricCard"]')).find(Boolean).textContent;
    expect(card('Connexions actives')).toContain('2');
    expect(card('Autres appareils connectés')).toContain('1');
    expect(card('Historique des sessions')).toContain('1');
    const rowButtons = within(screen.getByRole('table', { name: 'Sessions actives' })).getAllByRole('button', { name: /Safari sur iPhone/ });
    await user.click(rowButtons.find((button) => !/Déconnecter/.test(button.textContent + (button.getAttribute('aria-label') ?? ''))));
    expect(screen.getByRole('dialog', { name: 'Détail de la session' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Déconnecter cette session' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer la déconnexion' }));
    expect(api.revokeSession).toHaveBeenCalledWith('s-2');
    expect(onSessions).toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Détail de la session' })).toBeNull();
  });

  it('explains every refusal in French', () => {
    expect(revokeFailure(new BffRequestError('x', 409, null))).toBe('Pour fermer cette session, déconnectez-vous.');
    expect(revokeFailure(new Error('x'))).toBe('La déconnexion n’a pas été confirmée.');
  });

  it('MAIR-1258 names each session « navigateur · système » with its id under it, as the artifact', async () => {
    const user = userEvent.setup();
    const firefox = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0';
    const onNotify = vi.fn();
    api.revokeSession.mockResolvedValue({ sessions: [fixtures.session('s-1')], session_history: [] });
    render(<SessionsSection {...props({ onNotify, data: data({ sessions: [
      fixtures.session('s-1', { expires_at: future }),
      fixtures.session('c47e5d10-2b8a-4f63', { device_info: firefox, expires_at: future }),
    ] }) })} />);
    const active = screen.getByRole('table', { name: 'Sessions actives' });
    expect(within(active).getByText('Firefox 132 · Windows')).toBeTruthy();
    expect(within(active).queryByText(firefox)).toBeNull();
    expect(within(active).getByText('c47e5d10-2b8a-4f63')).toBeTruthy();
    await user.click(within(active).getByRole('button', { name: 'Déconnecter la session Firefox 132 · Windows' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer la déconnexion' }));
    expect(onNotify).toHaveBeenCalledWith('Session « Firefox 132 · Windows » déconnectée.');
  });

  it('MAIR-1258 sessionDeviceLabel reads a user-agent and keeps a text it cannot read', () => {
    expect(sessionDeviceLabel({ device_info: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1' })).toBe('Safari 18 · iOS 18.1');
    expect(sessionDeviceLabel({ device_info: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' })).toBe('Chrome 131 · Linux');
    expect(sessionDeviceLabel({ device_info: 'Firefox sur Linux' })).toBe('Firefox sur Linux');
    expect(sessionDeviceLabel({ device_info: 'curl/8.5' })).toBe('curl/8.5');
    expect(sessionDeviceLabel({ device_info: '  ' })).toBe('Appareil inconnu');
  });
});
