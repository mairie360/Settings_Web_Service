import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ProfilePhoto } from './ProfilePhoto';

describe('ProfilePhoto', () => {
  it('validates the photo before previewing it and offers save / clear', async () => {
    const onInvalid = vi.fn(); const onPreview = vi.fn(); const onSave = vi.fn();
    // jsdom has no object URLs: the preview only needs a stable string.
    const createObjectURL = vi.fn(() => 'blob:preview'); const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }));
    render(<ProfilePhoto initials="AM" busy={false} confirmedPhoto="" onInvalid={onInvalid} onPreview={onPreview} onSave={onSave} />);
    expect(screen.getByText('AM')).toBeTruthy();
    const input = screen.getByLabelText('Changer la photo');
    fireEvent.change(input, { target: { files: [new File(['x'], 'doc.txt', { type: 'text/plain' })] } }); expect(onInvalid).toHaveBeenCalled(); expect(onPreview).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { files: [new File(['x'], 'me.png', { type: 'image/png' })] } }); expect(onPreview).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la photo' })); expect(onSave).toHaveBeenCalledWith(expect.any(File));
    fireEvent.click(screen.getByRole('button', { name: 'Retirer l’aperçu' })); expect(screen.getByText('Aucun fichier choisi')).toBeTruthy();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview'); vi.unstubAllGlobals();
  });
});
