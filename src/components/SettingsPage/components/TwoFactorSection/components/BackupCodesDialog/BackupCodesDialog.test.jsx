import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BackupCodesDialog } from './BackupCodesDialog';

describe('BackupCodesDialog', () => {
  it('is closed without codes, and « Terminer » waits for the saved confirmation', async () => {
    const user = userEvent.setup(); const onDone = vi.fn();
    const { rerender } = render(<BackupCodesDialog codes={null} onDone={onDone} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<BackupCodesDialog codes={['aaaa-bbbb', 'cccc-dddd']} onDone={onDone} />);
    expect(screen.getByText('aaaa-bbbb')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    expect(onDone).not.toHaveBeenCalled();
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
