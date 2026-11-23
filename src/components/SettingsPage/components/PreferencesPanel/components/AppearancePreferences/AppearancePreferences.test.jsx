import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppearancePreferences } from './AppearancePreferences';

const values = { theme: null, font_family: 'Marianne', font_size: null, density: null };

describe('AppearancePreferences', () => {
  it('reads an unknown font and `null` values as the defaults and offers no theme (the page stays light)', () => {
    render(<AppearancePreferences values={values} disabled={false} save={vi.fn()} />);
    expect(screen.getByLabelText('Police de caractères').value).toBe('system');
    expect(screen.getByRole('slider', { name: /Taille du texte/ }).value).toBe('16');
    expect(screen.getByRole('radio', { name: 'Normale' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByText('Thème')).toBeNull();
  });

  it('saves the font and the density at once, and the text size once the slider is released', async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(undefined);
    render(<AppearancePreferences values={values} disabled={false} save={save} />);
    await user.selectOptions(screen.getByLabelText('Police de caractères'), 'atkinson');
    expect(save).toHaveBeenCalledWith({ font_family: 'atkinson' }, 'Police de caractères enregistrée');
    await user.click(screen.getByRole('radio', { name: 'Compacte' }));
    expect(save).toHaveBeenCalledWith({ density: 'compact' }, 'Densité enregistrée');
    const slider = screen.getByRole('slider', { name: /Taille du texte/ });
    fireEvent.change(slider, { target: { value: '20' } });
    expect(save).toHaveBeenCalledTimes(2);
    fireEvent.pointerUp(slider);
    expect(save).toHaveBeenLastCalledWith({ font_size: 20 }, 'Taille du texte : 20 px');
    fireEvent.blur(slider);
    expect(save).toHaveBeenCalledTimes(3);
  });

  it('keeps a refused value out of the page (the confirmed one comes back)', async () => {
    const save = vi.fn().mockRejectedValue(new Error('refused'));
    render(<AppearancePreferences values={{ ...values, font_size: 18 }} disabled={false} save={save} />);
    const slider = screen.getByRole('slider', { name: /Taille du texte/ });
    fireEvent.change(slider, { target: { value: '22' } });
    fireEvent.keyUp(slider);
    expect(await screen.findByDisplayValue('18')).toBeTruthy();
  });
});
