import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import SettingsPendingFeatures from '@/components/settings-pending-features';
import SessionRevokeControl from '@/components/settings-session-revoke';

it('preserves preference and professional drafts across tabs without calling a profile or invented endpoint', async () => {
  const { rerender } = render(<SettingsPendingFeatures tab="notifications" isAdmin={false} />);
  fireEvent.click(screen.getByLabelText('Messages'));
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les préférences' }));
  expect((await screen.findByRole('alert')).textContent).toContain('aucune modification du compte');
  rerender(<SettingsPendingFeatures tab="profile" isAdmin={false} />);
  fireEvent.change(screen.getByLabelText('Service'), { target: { value: 'Service saisi' } });
  rerender(<SettingsPendingFeatures tab="appearance" isAdmin={false} />);
  fireEvent.click(screen.getByLabelText('Sombre')); expect(screen.getByLabelText('Aperçu de l’apparence').style.background).toBe('rgb(23, 32, 51)');
  rerender(<SettingsPendingFeatures tab="notifications" isAdmin={false} />); expect(screen.getByLabelText('Messages').checked).toBe(false);
  rerender(<SettingsPendingFeatures tab="profile" isAdmin={false} />); expect(screen.getByLabelText('Service').value).toBe('Service saisi');
});
it('submits only changed preferences to a provided future bridge and prevents a second write', async () => {
  let resolve; const savePreferences = vi.fn().mockImplementation(patch => new Promise(ok => { resolve = () => ok({ messages:false,projects:true,calendar:true,theme:'system',fontFamily:'system',fontSize:17,density:'normal',homePage:'dashboard',autoOpenNotifications:false }); }));
  render(<SettingsPendingFeatures tab="notifications" isAdmin={false} port={{ savePreferences }} />);
  fireEvent.click(screen.getByLabelText('Messages')); const button = screen.getByRole('button', { name: 'Enregistrer les préférences' });
  fireEvent.click(button); fireEvent.click(button); expect(savePreferences).toHaveBeenCalledExactlyOnceWith({ messages: false });
  resolve(); await screen.findByText('Préférences enregistrées.'); expect(button.disabled).toBe(true);
});
it('keeps a failed professional draft and rejects inconsistent saved values', async () => {
  const saveExtendedProfile = vi.fn().mockResolvedValue({ service: 'Incomplete' });
  render(<SettingsPendingFeatures tab="profile" isAdmin={false} port={{ saveExtendedProfile }} />);
  fireEvent.change(screen.getByLabelText('Poste'), { target: { value: 'Poste saisi' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les informations professionnelles' }));
  await screen.findByText('Le profil complémentaire n’a pas été confirmé.'); expect(screen.getByLabelText('Poste').value).toBe('Poste saisi'); expect(saveExtendedProfile).toHaveBeenCalledExactlyOnceWith({ position: 'Poste saisi' });
});
it('validates password confirmation, reports an unavailable operation, and clears secrets on another tab', () => {
  const { rerender } = render(<SettingsPendingFeatures tab="security" isAdmin={false} />);
  fireEvent.change(screen.getByLabelText('Mot de passe actuel'), { target: { value: 'old' } });
  fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'new' } });
  fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'mismatch' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Changer le mot de passe' }).closest('form'));
  expect(screen.getByRole('alert').textContent).toContain('ne correspondent pas');
  fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'new' } }); fireEvent.submit(screen.getByRole('button', { name: 'Changer le mot de passe' }).closest('form'));
  expect(screen.getByRole('alert').textContent).toContain('aucune modification du compte');
  rerender(<SettingsPendingFeatures tab="general" isAdmin={false} />); rerender(<SettingsPendingFeatures tab="security" isAdmin={false} />); expect(screen.getByLabelText('Mot de passe actuel').value).toBe('');
});
it('requires the server MFA challenge and receipt before claiming activation', async () => {
  const confirmMfa = vi.fn().mockRejectedValue(new Error('Code refusé'));
  render(<SettingsPendingFeatures tab="security" isAdmin={false} port={{ startMfa: vi.fn().mockResolvedValue({ challengeId:'challenge-1',instruction:'Instruction reçue' }),confirmMfa }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Configurer la méthode' })); await screen.findByText('Instruction reçue');
  fireEvent.change(screen.getByLabelText('Code de vérification'), { target: { value: '123456' } }); fireEvent.click(screen.getByRole('button', { name:'Vérifier et activer' }));
  await screen.findByText('Code refusé'); expect(confirmMfa).toHaveBeenCalledExactlyOnceWith('challenge-1','123456'); expect(screen.queryByText('Authentification à deux facteurs confirmée.')).toBeNull();
});
it('requires session confirmation and leaves the list unchanged on refusal', async () => {
  const revoked = vi.fn(); const revokeSession = vi.fn().mockRejectedValue(new Error('Session refusée'));
  render(<SessionRevokeControl sessionId="s-1" label="Firefox" port={{ revokeSession }} onRevoked={revoked} />);
  fireEvent.click(screen.getByRole('button', { name:'Déconnecter cette session' })); expect(revokeSession).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name:'Confirmer la déconnexion' })); await screen.findByText('Session refusée'); expect(revoked).not.toHaveBeenCalled(); expect(revokeSession).toHaveBeenCalledExactlyOnceWith('s-1');
});
it('does not expose instance update controls to nonadministrators or invent deployed versions', () => {
  render(<SettingsPendingFeatures tab="system" isAdmin={false} />); expect(screen.queryByText('Mises à jour de l’instance')).toBeNull();
});
it('shows actual release notes and unsupported-version warning supplied by a future bridge', async () => {
  const data = { currentVersion:'1.0',policy:'pinned',pinnedVersion:'1.0',maintenanceWindow:'Dimanche',releases:[{ version:'1.0',notes:'Notes reçues',supported:false },{ version:'1.1',notes:'Nouvelle version',supported:true }] };
  const saveUpdates = vi.fn().mockResolvedValue({ ...data,policy:'automatic' });
  render(<SettingsPendingFeatures tab="system" isAdmin port={{ loadUpdates:vi.fn().mockResolvedValue(data),saveUpdates }} />);
  await screen.findByText('Notes reçues'); expect(screen.getByRole('alert').textContent).toContain('n’est plus supportée');
  fireEvent.change(screen.getByLabelText('Politique de mise à jour'), { target:{ value:'automatic' } }); fireEvent.click(screen.getByRole('button', { name:'Appliquer la politique' }));
  await screen.findByText('Demande confirmée pour la prochaine fenêtre de maintenance.'); expect(saveUpdates).toHaveBeenCalledExactlyOnceWith({ policy:'automatic' });
});

it('does not restore a delayed MFA challenge after leaving Security and returning', async () => {
  let receive; const startMfa = vi.fn(() => new Promise(resolve => { receive = resolve; }));
  const port = { startMfa };
  const { rerender } = render(<SettingsPendingFeatures tab="security" isAdmin={false} port={port} />);
  fireEvent.click(screen.getByRole('button', { name: 'Configurer la méthode' }));
  rerender(<SettingsPendingFeatures tab="general" isAdmin={false} port={port} />);
  rerender(<SettingsPendingFeatures tab="security" isAdmin={false} port={port} />);
  await act(async () => { receive({ challengeId:'late',instruction:'Late instruction' }); });
  expect(screen.queryByText('Late instruction')).toBeNull();
  expect(screen.queryByLabelText('Code de vérification')).toBeNull();
});
it('uses confirmed activation, received recovery codes, and an explicit disable receipt', async () => {
  const disableMfa = vi.fn().mockResolvedValue(undefined);
  const port = { startMfa:vi.fn().mockResolvedValue({ challengeId:'c1',instruction:'Instruction réelle' }),confirmMfa:vi.fn().mockResolvedValue(undefined),recoveryCodes:vi.fn().mockResolvedValue(['received-one','received-two']),disableMfa };
  const { rerender } = render(<SettingsPendingFeatures tab="security" isAdmin={false} port={port} />);
  fireEvent.click(screen.getByRole('button', { name:'Configurer la méthode' })); await screen.findByText('Instruction réelle');
  fireEvent.change(screen.getByLabelText('Code de vérification'),{ target:{ value:'123456' } });
  fireEvent.click(screen.getByRole('button',{ name:'Vérifier et activer' })); await screen.findByText('Cette méthode a été activée et confirmée.');
  fireEvent.click(screen.getByRole('button',{ name:'Afficher les codes de récupération' })); await screen.findByText('received-one');
  rerender(<SettingsPendingFeatures tab="general" isAdmin={false} port={port} />);
  rerender(<SettingsPendingFeatures tab="security" isAdmin={false} port={port} />);
  expect(screen.queryByText('received-one')).toBeNull();
  fireEvent.click(screen.getByRole('button',{ name:'Désactiver cette méthode' })); expect(disableMfa).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Code pour confirmer la désactivation'),{ target:{ value:'654321' } });
  fireEvent.click(screen.getByRole('button',{ name:'Confirmer la désactivation' })); await screen.findByText('Désactivation confirmée.');
  expect(disableMfa).toHaveBeenCalledExactlyOnceWith('authenticator','654321');
  expect(screen.queryByText('Cette méthode a été activée et confirmée.')).toBeNull();
});
