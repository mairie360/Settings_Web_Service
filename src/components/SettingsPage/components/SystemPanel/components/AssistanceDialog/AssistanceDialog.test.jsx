import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AssistanceDialog, useAssistanceDialog } from './AssistanceDialog';

// jsdom has no <dialog> methods: open/close through the attribute, as tests/component/settings-assistance.test.jsx does.
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } });

function Harness({ onStatus }) {
  const dialog = useAssistanceDialog(onStatus);
  return <><button type="button" onClick={(event) => dialog.prepare('support', event)}>Ouvrir</button><AssistanceDialog {...dialog} onStatus={onStatus} /></>;
}

describe('AssistanceDialog', () => {
  it('stays closed until prepared, then offers the message, its download and a close action', async () => {
    const user = userEvent.setup();
    render(<Harness onStatus={vi.fn()} />);
    expect(screen.queryByLabelText(/Votre message/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Ouvrir' }));
    expect(screen.getByLabelText(/Votre message/)).toBeTruthy(); expect(screen.getByRole('button', { name: 'Télécharger la demande' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByLabelText(/Votre message/)).toBeNull();
  });
});
