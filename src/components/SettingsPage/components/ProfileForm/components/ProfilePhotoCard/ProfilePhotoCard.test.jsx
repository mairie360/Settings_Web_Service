import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfilePhotoCard } from './ProfilePhotoCard';

const profile = { first_name: 'Alice', last_name: 'Martin', email: 'alice@mairie.fr', job_title: null, service: { id: 3, name: 'Voirie' } };

describe('ProfilePhotoCard', () => {
  it('MAIR-1258 shows the photo card of the artifact: title, description, accepted formats and the directory preview', () => {
    render(<ProfilePhotoCard profile={profile} photoUrl={null} photoError={null} disabled={false} onPhoto={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Photo de profil' })).toBeTruthy();
    expect(screen.getByText('Visible dans la messagerie, les projets et l’annuaire.')).toBeTruthy();
    expect(screen.getByText('Formats acceptés : JPG, PNG. Taille max : 2 Mo.')).toBeTruthy();
    // The field keeps its accessible name although the card title is the visible one.
    const input = screen.getByLabelText('Photo de profil', { selector: 'input' });
    expect(input.getAttribute('accept')).toBe('image/jpeg,image/png');
    expect(screen.getByText('Aperçu dans l’annuaire')).toBeTruthy();
    expect(screen.getByText('Agent · Voirie')).toBeTruthy();
  });

  it('MAIR-1258 hands an accepted JPG or PNG to the form and refuses another format or a file over 2 Mo', async () => {
    const onPhoto = vi.fn();
    const user = userEvent.setup({ applyAccept: false });
    render(<ProfilePhotoCard profile={profile} photoUrl={null} photoError={null} disabled={false} onPhoto={onPhoto} />);
    const input = screen.getByLabelText('Photo de profil', { selector: 'input' });
    await user.upload(input, new File([new Uint8Array(10)], 'portrait.webp', { type: 'image/webp' }));
    expect(screen.getByText('Ce format n’est pas accepté. Choisissez un fichier JPG ou PNG.')).toBeTruthy();
    await user.upload(input, new File([new Uint8Array(2_000_001)], 'lourde.png', { type: 'image/png' }));
    expect(screen.getByText('Ce fichier dépasse 2 Mo. Choisissez une image plus légère.')).toBeTruthy();
    expect(onPhoto).not.toHaveBeenCalled();
    const photo = new File([new Uint8Array(10)], 'portrait.jpg', { type: 'image/jpeg' });
    await user.upload(input, photo);
    expect(onPhoto).toHaveBeenCalledWith(photo);
  });
});
