import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import SettingsSection from './SettingsSection';

describe('SettingsSection', () => {
  it('wraps a card in a section with its h2 and description', () => {
    render(<SettingsSection title="Sessions" description="Vos connexions"><p>Lignes</p></SettingsSection>);
    expect(screen.getByRole('heading', { level: 2, name: 'Sessions' })).toBeTruthy(); expect((screen.getByText('Vos connexions')).classList.contains('settings-section-description')).toBe(true);
    expect(screen.getByText('Lignes')).toBeTruthy();
  });
});
