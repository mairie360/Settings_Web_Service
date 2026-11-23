import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NotificationsPreferences } from './NotificationsPreferences';

const values = { email: null, push: false, desktop: null, messages: true, projects: true, calendar: true };

describe('NotificationsPreferences', () => {
  it('shows the channels and the types, `null` as on, and saves the switched field with its receipt', async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(undefined);
    render(<NotificationsPreferences values={values} disabled={false} save={save} />);
    expect(screen.getByRole('heading', { name: 'Préférences de notification' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Types de notifications' })).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Notifications par e-mail' }).getAttribute('aria-checked')).toBe('true');
    await user.click(screen.getByRole('switch', { name: 'Nouveaux messages' }));
    expect(save).toHaveBeenCalledWith({ messages: false }, 'Option désactivée — Nouveaux messages');
  });

  it('MAIR-1127: each setting is a card with its icon, the notification types in the colour of their module', () => {
    const { container } = render(<NotificationsPreferences values={values} disabled={false} save={vi.fn()} />);
    expect(container.querySelectorAll('[data-m360-component~="SettingToggle"] [data-m360-component~="IconChip"]').length).toBe(6);
  });

  it('locks every switch while the section is unavailable', () => {
    render(<NotificationsPreferences values={values} disabled save={vi.fn()} />);
    for (const element of screen.getAllByRole('switch')) expect(element.hasAttribute('disabled')).toBe(true);
  });
});
