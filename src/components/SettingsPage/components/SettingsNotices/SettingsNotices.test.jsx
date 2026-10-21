import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingsNotices } from './SettingsNotices';

vi.mock('@/lib/logout', () => ({ navigateToLogin: vi.fn(), logoutAndRedirect: vi.fn() }));

describe('SettingsNotices', () => {
  it('announces the three kinds of failure and offers Réessayer before data, Actualiser after', async () => {
    const user = userEvent.setup(); const onReload = vi.fn();
    const { rerender } = render(<SettingsNotices error="" errorDetails={[]} readError="" logoutError="" recoverable={false} hasData reading={false} saving={false} onReload={onReload} />);
    expect(screen.queryByRole('alert')).toBeNull(); expect(screen.queryByRole('button')).toBeNull();
    rerender(<SettingsNotices error="Enregistrement refusé" errorDetails={['first_name : trop long']} readError="Lecture refusée" logoutError="La déconnexion reste à vérifier." recoverable hasData={false} reading={false} saving={false} onReload={onReload} />);
    expect(screen.getAllByRole('alert')).toHaveLength(3); expect(screen.getByText('first_name : trop long')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Réessayer' })); expect(onReload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Retour à la connexion' })).toBeTruthy();
    rerender(<SettingsNotices error="" errorDetails={[]} readError="" logoutError="" recoverable hasData reading saving={false} onReload={onReload} />);
    expect((screen.getByRole('button', { name: 'Chargement…' })).disabled).toBe(true);
  });
});
