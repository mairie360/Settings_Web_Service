import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SettingsPage from './SettingsPage';

vi.mock('@/lib/settings-api', () => ({ loadSettings: vi.fn(() => new Promise(() => {})), saveProfile: vi.fn() }));

describe('SettingsPage', () => {
  it('renders the shell and the loading state while the settings are read', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Paramètres' })).toBeTruthy();
    expect(screen.getAllByText('Chargement des paramètres…').length).toBeGreaterThan(0);
  });
});
