import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PasskeysSection } from './PasskeysSection';
import * as api from '@/lib/settings-api';
import * as webauthn from '@/lib/webauthn';
import { BffRequestError } from '@/lib/bff-client';

vi.mock('@/lib/settings-api', () => ({ loadPasskeys: vi.fn(), passkeyOptions: vi.fn(), registerPasskey: vi.fn(), deletePasskey: vi.fn() }));
vi.mock('@/lib/webauthn', async (original) => ({ ...(await original()), isWebAuthnSupported: vi.fn(() => true), createPasskeyCredential: vi.fn() }));

const laptop = { id: 7, label: 'Ordinateur de la mairie', provider: 'Google Password Manager', created_at: '2026-11-17T09:30:00Z', last_used_at: null };

beforeEach(() => { for (const method of Object.values(api)) method.mockReset(); webauthn.createPasskeyCredential.mockReset(); webauthn.isWebAuthnSupported.mockReturnValue(true); });
afterEach(() => vi.clearAllMocks());

describe('PasskeysSection (MAIR-811)', () => {
  it('S4: lists the passkeys, adds one through the browser ceremony and deletes one after confirmation', async () => {
    const user = userEvent.setup(); const onNotify = vi.fn();
    api.loadPasskeys.mockResolvedValueOnce([laptop]).mockResolvedValue([laptop, { ...laptop, id: 8, label: 'Téléphone', provider: null }]);
    api.passkeyOptions.mockResolvedValue({ options: { publicKey: {} } });
    webauthn.createPasskeyCredential.mockResolvedValue({ id: 'cred' });
    api.registerPasskey.mockResolvedValue({ ...laptop, id: 8, label: 'Téléphone' });
    api.deletePasskey.mockResolvedValue(undefined);
    render(<PasskeysSection onNotify={onNotify} onFailure={vi.fn()} />);
    expect(await screen.findByText('Ordinateur de la mairie')).toBeTruthy();
    expect(screen.getByText('Google Password Manager')).toBeTruthy();
    expect(screen.getByText('Jamais')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Créer une passkey/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Ajouter une passkey' });
    await user.click(within(dialog).getByRole('button', { name: 'Créer la passkey' }));
    expect(within(dialog).getByText('Donnez un nom à cette passkey.')).toBeTruthy();
    await user.type(within(dialog).getByRole('textbox', { name: /Nom de la passkey/ }), 'Téléphone');
    await user.click(within(dialog).getByRole('button', { name: 'Créer la passkey' }));
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Passkey « Téléphone » ajoutée.'));
    expect(api.registerPasskey).toHaveBeenCalledWith({ label: 'Téléphone', credential: { id: 'cred' } });
    expect(await screen.findByText('Téléphone')).toBeTruthy();
    expect(screen.getByText('Inconnu')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Supprimer la passkey Ordinateur de la mairie' }));
    await user.click(await screen.findByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Passkey « Ordinateur de la mairie » supprimée.'));
    expect(api.deletePasskey).toHaveBeenCalledWith(7);
  });

  it('shows the empty state, and says passkeys are refused by the mairie on a 403', async () => {
    const user = userEvent.setup();
    api.loadPasskeys.mockResolvedValue([]);
    api.passkeyOptions.mockRejectedValue(new BffRequestError('policy', 403, null));
    render(<PasskeysSection onNotify={vi.fn()} onFailure={vi.fn()} />);
    expect(await screen.findByText('Aucune passkey')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Créer une passkey/ }));
    await user.type(screen.getByRole('textbox', { name: /Nom de la passkey/ }), 'Clé');
    await user.click(screen.getByRole('button', { name: 'Créer la passkey' }));
    expect(await screen.findByText('Votre mairie n’autorise pas les passkeys.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Créer une passkey/ })).toBeNull();
  });

  it('offers no creation without WebAuthn and reports a failed deletion', async () => {
    const user = userEvent.setup(); const onFailure = vi.fn();
    webauthn.isWebAuthnSupported.mockReturnValue(false);
    api.loadPasskeys.mockResolvedValue([laptop]);
    api.deletePasskey.mockRejectedValue(new BffRequestError('gone', 404, null));
    render(<PasskeysSection onNotify={vi.fn()} onFailure={onFailure} />);
    expect(await screen.findByText('Ce navigateur ne permet pas de créer une passkey.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Créer une passkey/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Supprimer la passkey Ordinateur de la mairie' }));
    await user.click(await screen.findByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(onFailure).toHaveBeenCalledWith('Cette passkey n’existe plus.'));
  });
});
