import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DiagnosticSection } from './DiagnosticSection';

describe('DiagnosticSection', () => {
  it('exposes the diagnostic download', async () => {
    const user = userEvent.setup(); const onDownload = vi.fn();
    render(<DiagnosticSection onDownload={onDownload} />);
    await user.click(screen.getByRole('button', { name: 'Télécharger le diagnostic local' })); expect(onDownload).toHaveBeenCalled();
  });
});
