import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GeneralPreferences } from './GeneralPreferences';

const values = { language: 'fr', timezone: 'Europe/Paris', date_format: null, home_page: '/dashboard', auto_open_notifications: null };

describe('GeneralPreferences', () => {
  it('counts the changed fields, « Annuler » restores them and « Enregistrer » sends only them', async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(undefined);
    render(<GeneralPreferences values={values} disabled={false} save={save} />);
    expect(screen.getByText('Aucune modification à enregistrer.')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Fuseau horaire'), 'Indian/Reunion');
    await user.selectOptions(screen.getByLabelText('Format des dates'), 'YYYY-MM-DD');
    expect(screen.getByText('2 champs modifiés.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByLabelText('Fuseau horaire').value).toBe('Europe/Paris');
    await user.selectOptions(screen.getByLabelText('Langue'), 'en');
    expect(screen.getByText('1 champ modifié.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(save).toHaveBeenCalledWith({ language: 'en' }, 'Langue et région enregistrées');
  });

  it('MAIR-921: sends the home page as the path Core stores, and reads an earlier bare value as the default', async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(undefined);
    const { unmount } = render(<GeneralPreferences values={values} disabled={false} save={save} />);
    await user.selectOptions(screen.getByLabelText('Page d’accueil'), '/calendar');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(save).toHaveBeenCalledWith({ home_page: '/calendar' }, 'Langue et région enregistrées');
    unmount();
    render(<GeneralPreferences values={{ ...values, home_page: 'projects' }} disabled={false} save={vi.fn()} />);
    expect(screen.getByLabelText('Page d’accueil').value).toBe('/dashboard');
  });

  it('keeps the draft when the save is refused, and saves the automatic opening at once', async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockRejectedValueOnce(new Error('refused')).mockResolvedValue(undefined);
    render(<GeneralPreferences values={values} disabled={false} save={save} />);
    await user.selectOptions(screen.getByLabelText('Page d’accueil'), '/projects');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByLabelText('Page d’accueil').value).toBe('/projects');
    await user.click(screen.getByRole('switch', { name: 'Ouvrir automatiquement les notifications' }));
    expect(save).toHaveBeenLastCalledWith({ auto_open_notifications: true }, 'Option activée — Ouverture automatique des notifications');
  });
});
