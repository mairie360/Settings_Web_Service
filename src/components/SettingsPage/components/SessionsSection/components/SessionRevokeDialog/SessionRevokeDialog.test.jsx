import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SessionRevokeDialog from './SessionRevokeDialog';

describe('SessionRevokeDialog', () => {
  it('asks for confirmation and closes on cancel without revoking', async () => {
    const onClose = vi.fn(); const onRevoked = vi.fn();
    render(<SessionRevokeDialog session={{ id: 's1', device_info: 'Firefox' }} onClose={onClose} onRevoked={onRevoked} />);
    expect(screen.getByRole('dialog', { name: 'Déconnecter cette session ?' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onClose).toHaveBeenCalledTimes(1); expect(onRevoked).not.toHaveBeenCalled();
  });
});
