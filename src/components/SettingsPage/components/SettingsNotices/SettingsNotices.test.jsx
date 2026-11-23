import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingsNotices } from './SettingsNotices';

vi.mock('@/lib/logout', () => ({ navigateToLogin: vi.fn(), logoutAndRedirect: vi.fn() }));

describe('SettingsNotices', () => {
  it('announces the two kinds of failure and offers Réessayer before data, Actualiser after', async () => {
    const user = userEvent.setup(); const onReload = vi.fn();
    const { rerender } = render(<SettingsNotices readError="" logoutError="" recoverable={false} hasData reading={false} saving={false} onReload={onReload} />);
    expect(screen.queryByRole('alert')).toBeNull(); expect(screen.queryByRole('button')).toBeNull();
    rerender(<SettingsNotices readError="Lecture refusée" logoutError="La déconnexion reste à vérifier." recoverable hasData={false} reading={false} saving={false} onReload={onReload} />);
    expect(screen.getAllByRole('alert')).toHaveLength(2); expect(screen.getByText('Lecture refusée')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Réessayer' })); expect(onReload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Retour à la connexion' })).toBeTruthy();
    rerender(<SettingsNotices readError="" logoutError="" recoverable hasData reading saving={false} onReload={onReload} />);
    expect((screen.getByRole('button', { name: 'Chargement…' })).disabled).toBe(true);
  });
});
