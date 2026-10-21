import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PasswordForm } from './PasswordForm';

describe('PasswordForm', () => {
  it('checks the password confirmation locally and clears the fields when the epoch changes', async () => {
    const user = userEvent.setup(); const onInvalid = vi.fn(); const onSubmit = vi.fn();
    const { rerender } = render(<PasswordForm busy={false} epoch={0} onInvalid={onInvalid} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Mot de passe actuel'), 'old'); await user.type(screen.getByLabelText('Nouveau mot de passe'), 'new'); await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'other');
    fireEvent.submit(screen.getByRole('button', { name: 'Changer le mot de passe' }).closest('form'));
    expect(onInvalid).toHaveBeenCalledWith(expect.stringMatching(/ne correspondent pas/)); expect(onSubmit).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText('Confirmer le mot de passe')); await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'new');
    fireEvent.submit(screen.getByRole('button', { name: 'Changer le mot de passe' }).closest('form'));
    expect(onSubmit).toHaveBeenCalledWith('old', 'new', expect.any(Function));
    rerender(<PasswordForm busy={false} epoch={1} onInvalid={onInvalid} onSubmit={onSubmit} />);
    expect((screen.getByLabelText('Mot de passe actuel')).value).toBe('');
  });
});
