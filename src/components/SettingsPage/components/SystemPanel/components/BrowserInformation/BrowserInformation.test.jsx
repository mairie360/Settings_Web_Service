import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import BrowserInformation from './BrowserInformation';

describe('BrowserInformation', () => {
  it('lists the local browser information', () => {
    render(<BrowserInformation />);
    expect(screen.getByRole('heading', { level: 3, name: 'Informations du navigateur actuel' })).toBeTruthy();
    expect(screen.getByText('Navigateur').nextElementSibling.textContent).not.toBe('');
  });
});
