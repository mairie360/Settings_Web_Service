import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SessionDetailDialog } from './SessionDetailDialog';
import fixtures from '@tests/support/settings-fixtures.cjs';

const session = fixtures.session('s-2', { device_info: 'Safari sur iPhone', expires_at: new Date(Date.now() + 86_400_000).toISOString() });

describe('SessionDetailDialog', () => {
  it('shows the detail of another active session and offers to disconnect it', async () => {
    const user = userEvent.setup();
    const onRevoke = vi.fn(); const onClose = vi.fn();
    render(<SessionDetailDialog session={session} current={false} revocable onClose={onClose} onRevoke={onRevoke} />);
    expect(screen.getByRole('dialog', { name: 'Détail de la session' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Déconnecter cette session' }));
    expect(onRevoke).toHaveBeenCalledWith(session);
    await user.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('never offers to disconnect this device or an ended session, and stays closed without a session', () => {
    const { rerender } = render(<SessionDetailDialog session={session} current revocable onClose={vi.fn()} onRevoke={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Déconnecter cette session' })).toBeNull();
    rerender(<SessionDetailDialog session={session} current={false} revocable={false} onClose={vi.fn()} onRevoke={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Déconnecter cette session' })).toBeNull();
    rerender(<SessionDetailDialog session={null} current={false} revocable={false} onClose={vi.fn()} onRevoke={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
