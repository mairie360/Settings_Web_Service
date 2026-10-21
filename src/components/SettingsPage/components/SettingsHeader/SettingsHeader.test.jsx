import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SettingsHeader } from './SettingsHeader';

describe('SettingsHeader', () => {
  it('renders the page title and the current date', () => {
    render(<SettingsHeader />);
    expect(screen.getByRole('heading', { level: 1, name: 'Paramètres' })).toBeTruthy(); expect(document.querySelector('.page-current-date')).not.toBeNull();
  });
});
