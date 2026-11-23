import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TwoFactorSection } from './TwoFactorSection';
import * as api from '@/lib/settings-api';
import { BffRequestError } from '@/lib/bff-client';

vi.mock('@/lib/settings-api', () => ({ loadTwoFactor: vi.fn(), startTwoFactor: vi.fn(), confirmTwoFactor: vi.fn(), regenerateBackupCodes: vi.fn(), disableTwoFactor: vi.fn() }));
const codes = Array.from({ length: 10 }, (_, index) => `ab${index}c-d${index}ef`);
const refusal = (status) => new BffRequestError('refusé', status, { error: { code: 'E', message: 'refusé', details: [] } });

beforeEach(() => { for (const method of Object.values(api)) method.mockReset(); });

describe('TwoFactorSection (MAIR-807)', () => {
  it('S2: activates with the QR code and the first code, then shows the ten codes once until saved', async () => {
    const user = userEvent.setup(); const onNotify = vi.fn();
    api.loadTwoFactor.mockResolvedValueOnce({ enabled: false, backup_codes_remaining: 0 }).mockResolvedValueOnce({ enabled: true, backup_codes_remaining: 10 });
    api.startTwoFactor.mockResolvedValue({ secret: 'JBSWY3DPEHPK3PXP', otpauth_uri: 'otpauth://totp/Mairie360:agent?secret=JBSWY3DPEHPK3PXP' });
    api.confirmTwoFactor.mockRejectedValueOnce(refusal(400)).mockResolvedValueOnce({ backup_codes: codes });
    render(<TwoFactorSection onNotify={onNotify} />);
    expect(await screen.findByText('Désactivée')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Activer' }));
    const dialog = await screen.findByRole('dialog', { name: 'Activer la double authentification' });
    expect(await within(dialog).findByText('JBSWY3DPEHPK3PXP')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Vérifier le code' }));
    expect(within(dialog).getByText('Saisissez le code à 6 chiffres.')).toBeTruthy();
    await user.type(within(dialog).getByRole('textbox', { name: /Code de l’application/ }), '123456');
    await user.click(within(dialog).getByRole('button', { name: 'Vérifier le code' }));
    expect(await within(dialog).findByText(/Code incorrect/)).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Vérifier le code' }));
    const codesDialog = await screen.findByRole('dialog', { name: 'Codes de secours' });
    expect(within(codesDialog).getByText('Ces codes ne seront plus affichés.')).toBeTruthy();
    expect(within(codesDialog).getByText(codes[0])).toBeTruthy();
    const done = within(codesDialog).getByRole('button', { name: 'Terminer' });
    expect(done.disabled).toBe(true);
    expect(within(codesDialog).queryByRole('button', { name: 'Annuler' })).toBeNull();
    await user.click(within(codesDialog).getByLabelText('J’ai enregistré mes codes de secours en lieu sûr.'));
    await user.click(done);
    expect(onNotify).toHaveBeenCalledWith('Double authentification activée.');
    expect(await screen.findByText('Activée')).toBeTruthy();
    expect(screen.getByText('Codes de secours restants : 10 sur 10')).toBeTruthy();
  });

  it('S3: regenerates the codes, refuses a wrong password or code on deactivation, then deactivates', async () => {
    const user = userEvent.setup(); const onNotify = vi.fn();
    api.loadTwoFactor.mockResolvedValue({ enabled: true, backup_codes_remaining: 8 });
    api.regenerateBackupCodes.mockResolvedValue({ backup_codes: codes });
    api.disableTwoFactor.mockRejectedValueOnce(refusal(400)).mockResolvedValueOnce(undefined);
    render(<TwoFactorSection onNotify={onNotify} />);
    expect(await screen.findByText('Codes de secours restants : 8 sur 10')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Régénérer les codes de secours' }));
    const regenerate = await screen.findByRole('dialog', { name: 'Régénérer les codes de secours' });
    await user.type(within(regenerate).getByRole('textbox'), '654321');
    await user.click(within(regenerate).getByRole('button', { name: 'Régénérer' }));
    expect(api.regenerateBackupCodes).toHaveBeenCalledWith('654321');
    const codesDialog = await screen.findByRole('dialog', { name: 'Codes de secours' });
    await user.click(within(codesDialog).getByRole('checkbox'));
    await user.click(within(codesDialog).getByRole('button', { name: 'Terminer' }));
    expect(onNotify).toHaveBeenCalledWith('Nouveaux codes de secours enregistrés.');

    await user.click(screen.getByRole('button', { name: 'Désactiver' }));
    const disable = await screen.findByRole('dialog', { name: 'Désactiver la double authentification' });
    await user.type(within(disable).getByLabelText(/Mot de passe/), 'secret');
    await user.type(within(disable).getByRole('textbox', { name: /Code/ }), '111111');
    await user.click(within(disable).getByRole('button', { name: 'Désactiver' }));
    expect(await within(disable).findByText('Mot de passe ou code incorrect.')).toBeTruthy();
    await user.click(within(disable).getByRole('button', { name: 'Désactiver' }));
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Double authentification désactivée.'));
    expect(api.disableTwoFactor).toHaveBeenLastCalledWith({ password: 'secret', code: '111111' });
  });

  it('says the mairie imposes the factor when Core refuses the deactivation, and hides the action', async () => {
    const user = userEvent.setup();
    api.loadTwoFactor.mockResolvedValue({ enabled: true, backup_codes_remaining: 10 });
    api.disableTwoFactor.mockRejectedValue(refusal(403));
    render(<TwoFactorSection onNotify={() => {}} />);
    await user.click(await screen.findByRole('button', { name: 'Désactiver' }));
    const disable = await screen.findByRole('dialog');
    await user.type(within(disable).getByLabelText(/Mot de passe/), 'secret');
    await user.type(within(disable).getByRole('textbox', { name: /Code/ }), '111111');
    await user.click(within(disable).getByRole('button', { name: 'Désactiver' }));
    expect(await screen.findByText('Votre mairie impose la double authentification.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Désactiver' })).toBeNull();
  });

  it('offers « Réessayer » when the status is unavailable', async () => {
    const user = userEvent.setup();
    api.loadTwoFactor.mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce({ enabled: false, backup_codes_remaining: 0 });
    render(<TwoFactorSection onNotify={() => {}} />);
    await user.click(await screen.findByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByText('Désactivée')).toBeTruthy();
  });
});
