import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InstanceUpdatesPanel from './InstanceUpdatesPanel';

describe('InstanceUpdatesPanel', () => {
  it('shows the update policy form without a refresh when the port cannot load versions', () => {
    render(<InstanceUpdatesPanel port={{}} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Mises à jour de l’instance' })).toBeTruthy();
    expect(screen.getByLabelText(/Politique de mise à jour/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Actualiser les versions/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Appliquer la politique' })).toBeTruthy();
  });
});
