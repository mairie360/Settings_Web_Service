import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DraftPreferences } from './DraftPreferences';

const preferences = { email: true, push: false, desktop: false, messages: true, projects: true, calendar: true, theme: 'system', fontFamily: 'system', fontSize: 17, density: 'normal', homePage: 'dashboard', autoOpenNotifications: false };

describe('DraftPreferences', () => {
  it('renders the appearance draft and enables the save once a preference changed', () => {
    const { rerender } = render(<DraftPreferences tab="appearance" preferences={preferences} confirmed={preferences} busy={false} update={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Aperçu de l’apparence')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(true);
    rerender(<DraftPreferences tab="appearance" preferences={{ ...preferences, theme: 'dark' }} confirmed={preferences} busy={false} update={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(false);
  });
});
