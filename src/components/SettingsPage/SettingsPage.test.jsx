import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import SettingsPage from './SettingsPage';

vi.mock('@/lib/settings-api', () => ({ searchEverywhere: vi.fn(), loadTwoFactor: vi.fn(async () => ({ enabled: false, backup_codes_remaining: 0 })), loadSettings: vi.fn(() => new Promise(() => {})), saveProfile: vi.fn() }));

describe('SettingsPage', () => {
  it('renders the shell and the loading state while the settings are read', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Paramètres' })).toBeTruthy();
    expect(screen.getAllByText('Chargement des paramètres…').length).toBeGreaterThan(0);
  });
});
