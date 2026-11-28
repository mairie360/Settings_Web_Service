import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DirectoryPreview, directoryRole } from './DirectoryPreview';

describe('DirectoryPreview', () => {
  it('MAIR-1258 reads « Fonction · Service », « Agent » without a function, and leaves an empty service out', () => {
    expect(directoryRole('Cheffe de service', 'Voirie')).toBe('Cheffe de service · Voirie');
    expect(directoryRole(null, 'Voirie')).toBe('Agent · Voirie');
    expect(directoryRole('  ', null)).toBe('Agent');
  });

  it('MAIR-1258 shows the agent as the directory does: overline, avatar, name and role line', () => {
    const { container } = render(<DirectoryPreview firstName="Alice" lastName="Martin" jobTitle="Cheffe de service" service="Voirie" photoUrl="blob:photo" />);
    expect(screen.getByText('Aperçu dans l’annuaire')).toBeTruthy();
    expect(screen.getByText('Alice Martin')).toBeTruthy();
    expect(screen.getByText('Cheffe de service · Voirie')).toBeTruthy();
    expect(container.querySelector('[data-testid="settings-directory-card"] img[src="blob:photo"]')).not.toBeNull();
  });
});
