import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfileForm } from './ProfileForm';

const form = (overrides = {}) => ({ profile: { first_name: 'Alice', last_name: 'Martin', email: 'alice@mairie.fr', phone: null }, saving: false, hasChanges: false, emailChanged: false, currentPassword: '', setCurrentPassword: vi.fn(), updateProfile: vi.fn(), save: vi.fn((event) => event?.preventDefault?.()), ...overrides });

describe('ProfileForm', () => {
  it('renders nothing without a profile, then the four fields and a save action enabled on changes', async () => {
    const { container, rerender } = render(<ProfileForm form={form({ profile: null })} reading={false} />);
    expect(container.innerHTML).toBe('');
    const state = form();
    rerender(<ProfileForm form={state} reading={false} />);
    expect(screen.getByDisplayValue('alice@mairie.fr')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enregistrer le profil' }).disabled).toBe(true); expect(screen.getByText('Aucune modification à enregistrer.')).toBeTruthy();
    await userEvent.type(screen.getByDisplayValue('Alice'), 'x'); expect(state.updateProfile).toHaveBeenCalledWith('first_name', 'Alicex');
    rerender(<ProfileForm form={form({ hasChanges: true, emailChanged: true })} reading={false} />);
    expect(screen.getByRole('button', { name: 'Enregistrer le profil' }).disabled).toBe(false); expect(screen.getByLabelText(/Mot de passe actuel/)).toBeTruthy();
  });
});
