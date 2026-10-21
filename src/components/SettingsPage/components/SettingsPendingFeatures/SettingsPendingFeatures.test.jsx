import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SettingsPendingFeatures from './SettingsPendingFeatures';

describe('SettingsPendingFeatures', () => {
  it('renders the security cards, and the instance updates only for an administrator on the system tab', () => {
    const { rerender } = render(<SettingsPendingFeatures tab="security" isAdmin={false} />);
    expect(screen.getByRole('button', { name: 'Changer le mot de passe' })).toBeTruthy(); expect(screen.getByText('La double authentification n’est pas disponible sur cette instance.')).toBeTruthy();
    rerender(<SettingsPendingFeatures tab="system" isAdmin={false} systemContent={<p>Système</p>} />);
    expect(screen.queryByRole('heading', { name: 'Mises à jour de l’instance' })).toBeNull(); expect(screen.getByText('Système')).toBeTruthy();
    rerender(<SettingsPendingFeatures tab="system" isAdmin systemContent={<p>Système</p>} />);
    expect(screen.getByRole('heading', { name: 'Mises à jour de l’instance' })).toBeTruthy();
  });
});
