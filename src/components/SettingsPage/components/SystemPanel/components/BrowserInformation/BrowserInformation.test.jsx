import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BrowserInformation from './BrowserInformation';

describe('BrowserInformation', () => {
  it('lists the local browser information', () => {
    render(<BrowserInformation />);
    expect(screen.getByRole('heading', { level: 3, name: 'Informations du navigateur actuel' })).toBeTruthy();
    expect(screen.getByText('Navigateur').nextElementSibling.textContent).not.toBe('');
  });
});
