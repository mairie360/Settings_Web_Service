import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingsHeader } from './SettingsHeader';

describe('SettingsHeader', () => {
  it('renders the page title and the current date', () => {
    render(<SettingsHeader />);
    expect(screen.getByRole('heading', { level: 1, name: 'Paramètres' })).toBeTruthy(); expect(document.querySelector('.page-current-date')).not.toBeNull();
  });
});
