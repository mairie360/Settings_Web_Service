import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { SettingsLoading } from './SettingsLoading';

describe('SettingsLoading', () => {
  it('shows the loading panel, then the unavailable warning whose « Réessayer » reads again (MAIR-851, O1)', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<SettingsLoading reading failed={false} onRetry={onRetry} />);
    expect(screen.getByRole('heading', { name: 'Chargement des paramètres…' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(<SettingsLoading reading={false} failed onRetry={onRetry} />);
    expect(screen.getByRole('alert').textContent).toContain('Profil temporairement indisponible');
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(<SettingsLoading reading failed onRetry={onRetry} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
