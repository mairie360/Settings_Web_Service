import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SystemPanel from './SystemPanel';

// jsdom has no <dialog> methods: open/close through the attribute, as tests/component/settings-assistance.test.jsx does.
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } });

describe('SystemPanel', () => {
  it('offers the three assistance openers and opens the support dialog', async () => {
    const user = userEvent.setup();
    render(<SystemPanel />);
    expect(screen.getByRole('heading', { level: 2, name: 'Système et assistance' })).toBeTruthy();
    expect(screen.getAllByRole('button', { expanded: false }).filter((button) => button.getAttribute('aria-haspopup') === 'dialog')).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Préparer une demande de support' }));
    expect(screen.getByLabelText(/Votre message/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByLabelText(/Votre message/)).toBeNull();
  });
});
