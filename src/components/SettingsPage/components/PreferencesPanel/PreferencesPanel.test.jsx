import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import PreferencesPanel from './PreferencesPanel';
import fixtures from '@tests/support/settings-fixtures.cjs';

describe('PreferencesPanel', () => {
  it('shows the appearance section with its fields and save action', () => {
    render(<PreferencesPanel tab="appearance" bootstrap={fixtures.bootstrap()} reading={false} onWriting={vi.fn()} onRefresh={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Apparence' })).toBeTruthy();
    expect(screen.getByLabelText('Thème')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enregistrer les préférences' })).toBeTruthy();
  });
});
