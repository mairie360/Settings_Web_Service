import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingsLoading } from './SettingsLoading';

describe('SettingsLoading', () => {
  it('renders the loading and unavailable states', () => {
    const { rerender } = render(<SettingsLoading reading failed={false} />);
    expect(screen.getByText('Chargement des paramètres…')).toBeTruthy(); expect(document.querySelector('.mairie-skeleton')).not.toBeNull();
    rerender(<SettingsLoading reading={false} failed />);
    expect(screen.getByText('Le profil est indisponible.')).toBeTruthy(); expect(document.querySelector('.mairie-skeleton')).toBeNull();
  });
});
