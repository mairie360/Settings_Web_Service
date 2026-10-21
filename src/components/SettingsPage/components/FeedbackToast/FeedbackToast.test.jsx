import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { FailureToast, FeedbackToast } from './FeedbackToast';

describe('FeedbackToast', () => {
  it('keeps receipts announced and dismissible, failures as alerts', () => {
    const close = vi.fn();
    const { rerender } = render(<FeedbackToast message="" onClose={close} />);
    expect((screen.getByRole('status')).classList.contains('sr-only')).toBe(true);
    rerender(<FeedbackToast message="Préférences enregistrées." onClose={close} />);
    expect((screen.getByRole('status')).textContent).toContain('Préférences enregistrées.'); fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' })); expect(close).toHaveBeenCalled();
    rerender(<FailureToast message="Refusé" onClose={close} />); expect((screen.getByRole('alert')).textContent).toContain('Refusé');
  });
});
