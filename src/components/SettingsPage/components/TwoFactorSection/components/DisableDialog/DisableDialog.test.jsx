import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DisableDialog } from './DisableDialog';
import * as api from '@/lib/settings-api';
import { BffRequestError } from '@/lib/bff-client';

vi.mock('@/lib/settings-api', () => ({ disableTwoFactor: vi.fn() }));

describe('DisableDialog', () => {
  it('needs the password and a code, and reports a service failure', async () => {
    const user = userEvent.setup();
    api.disableTwoFactor.mockRejectedValue(new BffRequestError('down', 502, null));
    render(<DisableDialog open onClose={vi.fn()} onDisabled={vi.fn()} onImposed={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Désactiver' }));
    expect(screen.getByText('Saisissez votre mot de passe et le code à 6 chiffres.')).toBeTruthy();
    await user.type(screen.getByLabelText(/Mot de passe/), 'secret');
    await user.type(screen.getByRole('textbox', { name: /Code/ }), '123456');
    await user.click(screen.getByRole('button', { name: 'Désactiver' }));
    expect(await screen.findByText('La double authentification n’a pas pu être désactivée. Réessayez.')).toBeTruthy();
  });
});
