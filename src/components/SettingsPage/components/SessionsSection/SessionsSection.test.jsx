import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SessionsSection } from './SessionsSection';

describe('SessionsSection', () => {
  it('names the sessions card and shows the unavailable source', () => {
    render(<SessionsSection data={{ profile: { first_name: 'A', last_name: 'B', email: 'a@b', phone: null }, sessions: [], sources: { sessions: 'unavailable', preferences: 'available', notifications: 'available' } }} onRevoked={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Sessions' })).toBeTruthy(); expect(screen.getByText('Les sessions sont temporairement indisponibles.')).toBeTruthy();
  });
});
