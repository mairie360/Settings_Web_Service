import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppearancePreview } from './AppearancePreview';

describe('AppearancePreview', () => {
  it('bounds the appearance preview between 12 and 24 px', () => {
    render(<AppearancePreview appearance={{ theme: 'dark', font_family: 'Georgia', font_size: 40, density: 'compact' }} />);
    const preview = screen.getByLabelText('Aperçu de l’apparence');
    expect(preview.style.fontSize).toBe('24px'); expect(preview.style.padding).toBe('8px'); expect((preview).getAttribute('data-preview-theme')).toBe('dark');
  });
});
