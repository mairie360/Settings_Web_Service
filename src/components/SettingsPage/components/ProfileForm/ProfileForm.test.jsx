import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfileForm } from './ProfileForm';

const form = (overrides = {}) => ({
  profile: { first_name: 'Alice', last_name: 'Martin', email: 'alice@mairie.fr', phone: null },
  saving: false, hasChanges: false, changedCount: 0, emailChanged: false, currentPassword: '', fieldErrors: {}, focusTarget: '',
  setCurrentPassword: vi.fn(), updateProfile: vi.fn(), photoUrl: null, photoError: null, choosePhoto: vi.fn(async () => {}), cancel: vi.fn(), save: vi.fn((event) => event?.preventDefault?.()), ...overrides,
});

describe('ProfileForm (MAIR-864)', () => {
  it('renders nothing without a profile, then one card with the fields, Annuler and Enregistrer following the draft', async () => {
    const { container, rerender } = render(<ProfileForm form={form({ profile: null })} reading={false} />);
    expect(container.innerHTML).toBe('');
    const state = form();
    rerender(<ProfileForm form={state} reading={false} />);
    expect(screen.getByRole('heading', { name: 'Informations personnelles' })).toBeTruthy();
    expect(screen.getByDisplayValue('alice@mairie.fr')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enregistrer', exact: true }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Annuler', exact: true }).disabled).toBe(true);
    expect(screen.getByText('Aucune modification à enregistrer.')).toBeTruthy();
    await userEvent.type(screen.getByDisplayValue('Alice'), 'x'); expect(state.updateProfile).toHaveBeenCalledWith('first_name', 'Alicex');
    const changed = form({ hasChanges: true, changedCount: 2, emailChanged: true });
    rerender(<ProfileForm form={changed} reading={false} />);
    expect(screen.getByText('2 champs modifiés.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enregistrer', exact: true }).disabled).toBe(false); expect(screen.getByLabelText(/Mot de passe actuel/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Annuler', exact: true })); expect(changed.cancel).toHaveBeenCalledTimes(1);
    rerender(<ProfileForm form={form({ hasChanges: true, changedCount: 1, saving: true })} reading={false} />);
    expect(screen.getByText('1 champ modifié.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Enregistrement…/ })).toBeTruthy();
  });

  it('shows each error under its field, focuses the first one and marks it invalid', () => {
    render(<ProfileForm form={form({ hasChanges: true, changedCount: 1, fieldErrors: { first_name: 'Le prénom est obligatoire.', phone: 'Saisissez un numéro au format 06 12 34 56 78.' }, focusTarget: 'first_name' })} reading={false} />);
    const first = screen.getByRole('textbox', { name: /Prénom/ });
    expect(first.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(first.getAttribute('aria-describedby').split(' ')[0]).textContent).toContain('Le prénom est obligatoire.');
    expect(document.activeElement).toBe(first);
    expect(screen.getByRole('textbox', { name: /Téléphone/ }).getAttribute('aria-invalid')).toBe('true');
  });

  it('says who sees the phone number (MAIR-292)', () => {
    render(<ProfileForm form={form()} reading={false} />);
    const phone = screen.getByRole('textbox', { name: /Téléphone/ });
    const hint = document.getElementById(phone.getAttribute('aria-describedby').split(' ')[0]);
    expect(hint.textContent).toMatch(/^Visible par tous les agents de la mairie \(usage professionnel\)\./);
  });

  it('MAIR-1231 shows the photo, the read-only service, the function and the biography of the mockup', async () => {
    const state = form({ profile: { first_name: 'Alice', last_name: 'Martin', email: 'alice@mairie.fr', phone: null, job_title: 'Cheffe de service', biography: null, service: { id: 3, name: 'Voirie' }, has_photo: false } });
    render(<ProfileForm form={state} reading={false} />);
    expect(screen.getByText('AM')).toBeTruthy();
    expect(screen.getByLabelText(/Photo de profil/)).toBeTruthy();
    const service = screen.getByRole('textbox', { name: /Service/ });
    expect(service.value).toBe('Voirie');
    expect(service.disabled).toBe(true);
    expect(screen.getByText('Défini par l’administration.')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Fonction/ }).value).toBe('Cheffe de service');
    const bio = screen.getByRole('textbox', { name: /Bio/ });
    expect(bio.tagName).toBe('TEXTAREA');
    expect(bio.getAttribute('maxlength')).toBe('1000');
    await userEvent.type(bio, 'V');
    expect(state.updateProfile).toHaveBeenCalledWith('biography', 'V');
    const photo = new File([new Uint8Array(10)], 'portrait.png', { type: 'image/png' });
    await userEvent.upload(screen.getByLabelText(/Photo de profil/), photo);
    expect(state.choosePhoto).toHaveBeenCalledWith(photo);
  });

  it('MAIR-1231 without a service the field says so, and a refused photo is shown under the photo field', () => {
    render(<ProfileForm form={form({ photoError: 'Cette photo dépasse 100 Ko une fois compressée.', photoUrl: 'blob:photo' })} reading={false} />);
    expect(screen.getByRole('textbox', { name: /Service/ }).value).toBe('Aucun service');
    expect(screen.getByText('Cette photo dépasse 100 Ko une fois compressée.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retirer' })).toBeTruthy();
  });
});
