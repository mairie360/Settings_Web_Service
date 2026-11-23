import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RegenerateDialog } from './RegenerateDialog';
import * as api from '@/lib/settings-api';

vi.mock('@/lib/settings-api', () => ({ regenerateBackupCodes: vi.fn() }));

describe('RegenerateDialog', () => {
  it('asks for six digits, says « Code incorrect. » on a refusal and hands the new codes over', async () => {
    const user = userEvent.setup(); const onRegenerated = vi.fn();
    api.regenerateBackupCodes.mockRejectedValueOnce(new Error('400')).mockResolvedValueOnce({ backup_codes: ['aaaa-bbbb'] });
    render(<RegenerateDialog open onClose={vi.fn()} onRegenerated={onRegenerated} />);
    await user.click(screen.getByRole('button', { name: 'Régénérer' }));
    expect(screen.getByText('Saisissez le code à 6 chiffres.')).toBeTruthy();
    await user.type(screen.getByRole('textbox'), '123456');
    await user.click(screen.getByRole('button', { name: 'Régénérer' }));
    expect(await screen.findByText('Code incorrect.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Régénérer' }));
    expect(onRegenerated).toHaveBeenCalledWith(['aaaa-bbbb']);
  });
});
