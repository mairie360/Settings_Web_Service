import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProtectionSection, protectionScore } from './ProtectionSection';

describe('ProtectionSection', () => {
  it('scores the three criteria: second factor, sign-in alerts, at most three active sessions', () => {
    expect(protectionScore({ twoFactorEnabled: true, loginAlerts: true, activeSessions: 3 })).toBe(3);
    expect(protectionScore({ twoFactorEnabled: true, loginAlerts: null, activeSessions: 4 })).toBe(1);
    expect(protectionScore({ twoFactorEnabled: null, loginAlerts: false, activeSessions: null })).toBe(0);
  });

  it('says « Bien protégé », « Correct » or « À renforcer » and opens Sessions from « Gérer »', async () => {
    const user = userEvent.setup();
    const onManageSessions = vi.fn();
    const { rerender } = render(<ProtectionSection twoFactorEnabled loginAlerts activeSessions={2} onManageSessions={onManageSessions} />);
    expect(screen.getByText('Bien protégé')).toBeTruthy();
    expect(screen.getByText('Score de protection : 3 sur 3')).toBeTruthy();
    expect(screen.getByText('2 sessions actives sur vos appareils')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Gérer' }));
    expect(onManageSessions).toHaveBeenCalled();
    rerender(<ProtectionSection twoFactorEnabled loginAlerts={false} activeSessions={1} onManageSessions={onManageSessions} />);
    expect(screen.getByText('Correct')).toBeTruthy();
    expect(screen.getByText('1 session active sur vos appareils')).toBeTruthy();
    rerender(<ProtectionSection twoFactorEnabled={false} loginAlerts={false} activeSessions={null} onManageSessions={onManageSessions} />);
    expect(screen.getByText('À renforcer')).toBeTruthy();
    expect(screen.getByText('Sessions momentanément indisponibles.')).toBeTruthy();
  });
});
