import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import SettingsPendingFeatures from './SettingsPendingFeatures';

describe('SettingsPendingFeatures', () => {
  it('renders the password card on security and the sessions content on its own tab (MAIR-851)', () => {
    const { rerender } = render(<SettingsPendingFeatures tab="security" sessionsContent={<p>Liste des sessions</p>} />);
    expect(screen.getByRole('button', { name: 'Changer le mot de passe' })).toBeTruthy();
    expect(screen.queryByText('Liste des sessions')).toBeNull();
    expect(screen.queryByRole('link', { name: /double authentification/ })).toBeNull();
    rerender(<SettingsPendingFeatures tab="sessions" sessionsContent={<p>Liste des sessions</p>} />);
    expect(screen.getByText('Liste des sessions')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Changer le mot de passe' })).toBeNull();
  });
});
