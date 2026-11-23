import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import SettingsPendingFeatures from '@/components/SettingsPage/components/SettingsPendingFeatures';
import SessionRevokeControl from '@/components/SettingsPage/components/SessionsSection/components/SessionRevokeDialog';

it('preserves preference drafts across tabs without calling a profile or invented endpoint', async () => {
  const { rerender } = render(<SettingsPendingFeatures tab="notifications" />);
  fireEvent.click(screen.getByLabelText('Messages'));
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les préférences' }));
  expect((await screen.findByRole('alert')).textContent).toContain('aucune modification du compte');
  rerender(<SettingsPendingFeatures tab="appearance" />);
  fireEvent.click(screen.getByLabelText('Sombre')); expect(screen.getByLabelText('Aperçu de l’apparence').style.background).toBe('var(--mairie-navigation-background)');
  rerender(<SettingsPendingFeatures tab="notifications" />); expect(screen.getByLabelText('Messages').checked).toBe(false);
  rerender(<SettingsPendingFeatures tab="profile" />);
});
it('submits only changed preferences to a provided future bridge and prevents a second write', async () => {
  let resolve; const savePreferences = vi.fn().mockImplementation(patch => new Promise(ok => { resolve = () => ok({ messages:false,projects:true,calendar:true,theme:'system',fontFamily:'system',fontSize:17,density:'normal',homePage:'dashboard',autoOpenNotifications:false }); }));
  render(<SettingsPendingFeatures tab="notifications" port={{ savePreferences }} />);
  fireEvent.click(screen.getByLabelText('Messages')); const button = screen.getByRole('button', { name: 'Enregistrer les préférences' });
  fireEvent.click(button); fireEvent.click(button); expect(savePreferences).toHaveBeenCalledExactlyOnceWith({ messages: false });
  resolve(); await screen.findByText('Préférences enregistrées.'); expect(button.disabled).toBe(true);
});
it('validates password confirmation, reports an unavailable operation, and clears secrets on another tab', () => {
  const { rerender } = render(<SettingsPendingFeatures tab="security" />);
  fireEvent.change(screen.getByLabelText('Mot de passe actuel'), { target: { value: 'ancien-2026' } });
  fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'nouveau-2026' } });
  fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'mismatch' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Changer le mot de passe' }).closest('form'));
  expect(screen.getByRole('alert').textContent).toContain('ne correspondent pas');
  fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'nouveau-2026' } }); fireEvent.submit(screen.getByRole('button', { name: 'Changer le mot de passe' }).closest('form'));
  expect(screen.getByRole('alert').textContent).toContain('aucune modification du compte');
  rerender(<SettingsPendingFeatures tab="general" />); rerender(<SettingsPendingFeatures tab="security" />); expect(screen.getByLabelText('Mot de passe actuel').value).toBe('');
});
it('requires session confirmation and leaves the list unchanged on refusal', async () => {
  const revoked = vi.fn(); const revokeSession = vi.fn().mockRejectedValue(new Error('Session refusée'));
  // MAIR-607: the dialog is opened by the SessionList row action; the request waits for the confirmation.
  render(<SessionRevokeControl session={{ id: 's-1', device_info: 'Firefox' }} port={{ revokeSession }} onRevoked={revoked} onClose={() => {}} />);
  expect(revokeSession).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name:'Confirmer la déconnexion' })); expect((await screen.findByRole('alert')).textContent).toContain('Session refusée'); expect(revoked).not.toHaveBeenCalled(); expect(revokeSession).toHaveBeenCalledExactlyOnceWith('s-1');
});



