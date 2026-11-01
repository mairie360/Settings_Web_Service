import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TwoFactorSection } from './TwoFactorSection';

describe('TwoFactorSection', () => {
  it('links two-factor to the account console only when the instance has one', () => {
    const { rerender } = render(<TwoFactorSection twoFactorUrl="https://sso.example/account" />);
    expect((screen.getByRole('link', { name: 'Gérer ma double authentification' })).getAttribute('href')).toBe('https://sso.example/account');
    rerender(<TwoFactorSection />); expect(screen.getByText('La double authentification n’est pas disponible sur cette instance.')).toBeTruthy();
  });
});
