import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EnableDialog, CODE_REQUIRED } from './EnableDialog';
import * as api from '@/lib/settings-api';

vi.mock('@/lib/settings-api', () => ({ startTwoFactor: vi.fn(), confirmTwoFactor: vi.fn() }));

describe('EnableDialog', () => {
  it('says the activation is not possible when the secret cannot be prepared, and closes with Annuler', async () => {
    const user = userEvent.setup(); const onClose = vi.fn();
    api.startTwoFactor.mockRejectedValue(new Error('409'));
    render(<EnableDialog open onClose={onClose} onEnabled={vi.fn()} />);
    expect(await screen.findByText('La double authentification ne peut pas être activée pour le moment.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('refuses a code that is not six digits before any request', async () => {
    const user = userEvent.setup();
    api.startTwoFactor.mockResolvedValue({ secret: 'ABC', otpauth_uri: 'otpauth://totp/x?secret=ABC' });
    render(<EnableDialog open onClose={vi.fn()} onEnabled={vi.fn()} />);
    await screen.findByText('ABC');
    await user.type(screen.getByRole('textbox', { name: /Code de l’application/ }), '12');
    await user.click(screen.getByRole('button', { name: 'Vérifier le code' }));
    expect(screen.getByText(CODE_REQUIRED)).toBeTruthy();
    expect(api.confirmTwoFactor).not.toHaveBeenCalled();
  });
});
