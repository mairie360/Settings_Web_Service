import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SessionMetrics } from './SessionMetrics';

describe('SessionMetrics', () => {
  it('shows the four indicators, « — » for what could not be read and no invented location', () => {
    render(<SessionMetrics active={3} others={2} history={null} />);
    expect(screen.getByText('Sessions actives').closest('[data-m360-component~="MetricCard"]').textContent).toContain('3');
    expect(screen.getByText('Autres appareils connectés').closest('[data-m360-component~="MetricCard"]').textContent).toContain('2');
    expect(screen.getByText('Sessions dans l’historique').closest('[data-m360-component~="MetricCard"]').textContent).toContain('—');
    expect(screen.getByText('Localisation de cet appareil').closest('[data-m360-component~="MetricCard"]').textContent).toContain('Non disponible');
  });
});
