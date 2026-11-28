import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import SettingsPendingFeatures from './SettingsPendingFeatures';

describe('SettingsPendingFeatures', () => {
  it('renders the password card on security and the sessions content on its own tab (MAIR-851)', () => {
    const { rerender } = render(<SettingsPendingFeatures tab="security" sessionsContent={<p>Liste des sessions</p>} />);
    expect(screen.getByRole('button', { name: 'Changer le mot de passe' })).toBeTruthy();
    expect(screen.queryByText('Liste des sessions')).toBeNull();
    expect(screen.queryByRole('link', { name: /double authentification/ })).toBeNull();
    rerender(<SettingsPendingFeatures tab="sessions" sessionsContent={<p>Liste des sessions</p>} />);
    expect(screen.getByText('Liste des sessions')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Changer le mot de passe' })).toBeNull();
  });

  it('MAIR-1258 puts « Protection du compte » beside the password form, the other security cards below', () => {
    const { container } = render(<SettingsPendingFeatures tab="security" securityAside={<section>Protection du compte</section>} securityContent={<section>Double authentification</section>} />);
    const grid = container.querySelector('.settings-security-grid');
    expect(grid).not.toBeNull();
    expect(grid.children).toHaveLength(2);
    expect(grid.lastElementChild.textContent).toBe('Protection du compte');
    expect(grid.firstElementChild.textContent).toMatch(/Mot de passe/);
    expect(grid.textContent).not.toMatch(/Double authentification/);
    expect(grid.nextElementSibling.textContent).toBe('Double authentification');
  });
});
