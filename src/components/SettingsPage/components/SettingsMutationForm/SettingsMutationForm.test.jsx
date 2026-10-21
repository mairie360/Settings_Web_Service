import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SettingsMutationForm from './SettingsMutationForm';

describe('SettingsMutationForm', () => {
  it('renders a real form in the browser and submits through the handler only', () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(<SettingsMutationForm data-form="profile" className="space-y-4" onSubmit={onSubmit}><button type="submit">Enregistrer</button></SettingsMutationForm>);
    const form = document.querySelector('form[data-settings-mutation]');
    expect(form.getAttribute('data-form')).toBe('profile'); expect(form.getAttribute('method')).toBe('post');
    fireEvent.submit(form); expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
