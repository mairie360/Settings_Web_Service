import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AddPasskeyDialog } from './AddPasskeyDialog';
import * as api from '@/lib/settings-api';
import * as webauthn from '@/lib/webauthn';
import { BffRequestError } from '@/lib/bff-client';

vi.mock('@/lib/settings-api', () => ({ passkeyOptions: vi.fn(), registerPasskey: vi.fn() }));
vi.mock('@/lib/webauthn', async (original) => ({ ...(await original()), createPasskeyCredential: vi.fn() }));

describe('AddPasskeyDialog', () => {
  it('refuses < and >, stays silent when the browser window is closed, and explains a credential already registered', async () => {
    const user = userEvent.setup();
    api.passkeyOptions.mockResolvedValue({ options: {} });
    webauthn.createPasskeyCredential.mockRejectedValueOnce(new DOMException('closed', 'NotAllowedError')).mockResolvedValue({ id: 'cred' });
    api.registerPasskey.mockRejectedValue(new BffRequestError('dup', 409, null));
    render(<AddPasskeyDialog open onClose={vi.fn()} onAdded={vi.fn()} onRefused={vi.fn()} />);
    const name = screen.getByRole('textbox', { name: /Nom de la passkey/ });
    await user.type(name, '<b>');
    await user.click(screen.getByRole('button', { name: 'Créer la passkey' }));
    expect(screen.getByText('Le nom ne doit pas contenir < ni >.')).toBeTruthy();
    await user.clear(name); await user.type(name, 'Clé USB');
    await user.click(screen.getByRole('button', { name: 'Créer la passkey' }));
    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Créer la passkey' }));
    expect(await screen.findByText('Cette passkey est déjà enregistrée sur votre compte.')).toBeTruthy();
  });
});
