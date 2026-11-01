import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PreferenceSelect } from './PreferenceSelect';

describe('PreferenceSelect', () => {
  it('keeps « Par défaut » for a null preference and an unknown current value selectable', async () => {
    const user = userEvent.setup(); const onChange = vi.fn();
    const { rerender } = render(<PreferenceSelect label="Thème" value={null} options={[['light', 'Clair'], ['dark', 'Sombre']]} onChange={onChange} />);
    expect((screen.getByLabelText('Thème')).value).toBe(''); expect(screen.getByRole('option', { name: 'Par défaut' })).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Thème'), 'dark'); expect(onChange).toHaveBeenCalledWith('dark');
    rerender(<PreferenceSelect label="Thème" value="sepia" options={[['light', 'Clair']]} onChange={onChange} />);
    expect(screen.getByRole('option', { name: 'sepia' })).toBeTruthy();
  });
});
