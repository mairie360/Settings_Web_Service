import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import * as api from '@/lib/settings-api';
import fixtures from '../support/settings-fixtures.cjs';

vi.mock('@/lib/settings-api', () => ({ loadSettings: vi.fn(), saveProfile: vi.fn(), saveAppearance: vi.fn(), saveGeneral: vi.fn(), saveNotifications: vi.fn() }));
const deferred = () => { let resolve; let reject; const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; }); return { promise, resolve, reject }; };
const tab = name => fireEvent.click(screen.getByRole('tab', { name, exact: true }));
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les préférences', exact: true }));
const select = (name, value) => fireEvent.change(screen.getByLabelText(name), { target: { value } });
const refresh = async body => {
  vi.mocked(api.loadSettings).mockResolvedValueOnce(body);
  await act(async () => { window.dispatchEvent(new Event('focus')); });
};
beforeEach(() => {
  for (const operation of Object.values(api)) operation.mockReset();
  api.loadSettings.mockResolvedValue(fixtures.bootstrap());
  api.saveAppearance.mockResolvedValue(fixtures.appearance({ theme: 'dark' }));
  api.saveGeneral.mockResolvedValue(fixtures.general({ home_page: 'projects' }));
  api.saveNotifications.mockResolvedValue(fixtures.notifications({ messages: false }));
});

it('hydrates persisted values, isolates tab patches, and uses the server confirmation', async () => {
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' });
  tab('Apparence'); expect(screen.getByLabelText('Police de caractères').value).toBe('Marianne');
  select('Thème', 'dark');
  tab('Notifications'); expect(screen.getByLabelText('Calendrier').value).toBe('false');
  select('Messages', 'false'); const button = screen.getByRole('button', { name: 'Enregistrer les préférences' }); fireEvent.click(button); fireEvent.click(button);
  await screen.findByText('Préférences enregistrées.');
  expect(api.saveNotifications).toHaveBeenCalledExactlyOnceWith({ messages: false });
  expect(api.saveAppearance).not.toHaveBeenCalled();
  tab('Apparence'); expect(screen.getByLabelText('Thème').value).toBe('dark');
  api.saveAppearance.mockResolvedValueOnce(fixtures.appearance({ theme: 'light' })); save();
  await screen.findByText('Préférences enregistrées.');
  expect(api.saveAppearance).toHaveBeenCalledExactlyOnceWith({ theme: 'dark' });
  expect(screen.getByLabelText('Thème').value).toBe('light');
  expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(true);
});

it('keeps null values as inherited defaults and sends only an explicit reset', async () => {
  api.loadSettings.mockResolvedValueOnce(fixtures.bootstrap({ appearance: null, general: null, notifications: null }));
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' }); tab('Apparence');
  expect(screen.getByLabelText('Thème').value).toBe('');
  expect(screen.getByLabelText('Police de caractères').value).toBe('');
  expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(true);
  select('Thème', 'dark'); select('Thème', '');
  expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(true);
  tab('Général'); expect(screen.getByLabelText('Ouverture automatique des notifications').value).toBe('');
  expect(screen.queryByLabelText(/Fuseau horaire/i)).toBeNull();
  await refresh(fixtures.bootstrap()); tab('Apparence'); select('Thème', '');
  api.saveAppearance.mockResolvedValueOnce(fixtures.appearance({ theme: null })); save();
  await screen.findByText('Préférences enregistrées.'); expect(api.saveAppearance).toHaveBeenCalledExactlyOnceWith({ theme: null });
});

it('retains dirty edits across a foreground read and refuses malformed save snapshots', async () => {
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' }); tab('Apparence'); select('Thème', 'dark');
  await refresh(fixtures.bootstrap({ appearance: fixtures.appearance({ font_family: 'Arial', theme: 'light' }) }));
  expect(screen.getByLabelText('Thème').value).toBe('dark'); expect(screen.getByLabelText('Police de caractères').value).toBe('Arial');
  api.saveAppearance.mockResolvedValueOnce({ theme: 'light', font_family: 'Arial', font_size: 16, density: {} }); save();
  expect((await screen.findByRole('alert')).textContent).toContain('n’a pas été confirmé');
  expect(screen.getByLabelText('Thème').value).toBe('dark'); expect(screen.queryByText('Préférences enregistrées.')).toBeNull();
  api.saveAppearance.mockRejectedValueOnce(new Error('Validation refusée')); save();
  await screen.findByText('Validation refusée'); expect(screen.getByLabelText('Thème').value).toBe('dark');
  expect(api.saveAppearance).toHaveBeenLastCalledWith({ theme: 'dark' });
});

it('blocks unavailable sources and recovers their drafts when the source returns', async () => {
  render(<Home />); await screen.findByRole('tab', { name: 'Notifications' }); tab('Notifications'); select('Messages', 'false');
  await refresh(fixtures.bootstrap({ notifications: null, sources: { notifications: 'unavailable' } }));
  expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(true);
  expect(screen.getByLabelText('Messages').value).toBe('false'); save(); expect(api.saveNotifications).not.toHaveBeenCalled();
  await refresh(fixtures.bootstrap()); save(); await screen.findByText('Préférences enregistrées.');
  expect(api.saveNotifications).toHaveBeenCalledExactlyOnceWith({ messages: false });
});

it('keeps the other account safe when an earlier save settles after a foreground account change', async () => {
  const pending = deferred(); api.saveNotifications.mockReturnValueOnce(pending.promise);
  render(<Home />); await screen.findByRole('tab', { name: 'Notifications' }); tab('Notifications'); select('Messages', 'false'); save();
  // A focus event during a write must not start a competing bootstrap read.
  await act(async () => { window.dispatchEvent(new Event('focus')); }); expect(api.loadSettings).toHaveBeenCalledTimes(1);
  await act(async () => pending.resolve(fixtures.notifications({ messages: false })));
  await refresh(fixtures.bootstrap({ profile: fixtures.profile({ email: 'autre@mairie.test' }), notifications: fixtures.notifications({ messages: true }) }));
  expect(screen.getByLabelText('Messages').value).toBe('true');
  expect(screen.queryByText('Préférences enregistrées.')).toBeNull();
  expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(true);
});

it('does not commit a save after the page has been unmounted', async () => {
  const pending = deferred(); api.saveGeneral.mockReturnValueOnce(pending.promise);
  const view = render(<Home />); await screen.findByRole('tab', { name: 'Général' }); tab('Général'); select('Page d’accueil par défaut', 'projects'); save(); expect(api.saveGeneral).toHaveBeenCalledExactlyOnceWith({ home_page: 'projects' });
  view.unmount(); render(<Home />); await screen.findByRole('tab', { name: 'Général' }); tab('Général');
  await act(async () => pending.resolve(fixtures.general({ home_page: 'projects' })));
  expect(screen.getByLabelText('Page d’accueil par défaut').value).toBe('dashboard'); expect(screen.queryByText('Préférences enregistrées.')).toBeNull();
});

it('retains a confirmed preference when an unrelated profile save updates bootstrap', async () => {
  api.saveProfile.mockResolvedValueOnce(fixtures.profile({ first_name: 'Anne' }));
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' }); tab('Apparence'); select('Thème', 'dark'); save();
  await screen.findByText('Préférences enregistrées.'); tab('Profil');
  fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Anne' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le profil' }));
  await screen.findByText('Votre profil a été enregistré.'); tab('Apparence');
  expect(screen.getByLabelText('Thème').value).toBe('dark');
  expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(true);
});

it('keeps edits made during a foreground read and waits for that read before saving', async () => {
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' }); tab('Apparence');
  const pending = deferred(); api.loadSettings.mockReturnValueOnce(pending.promise);
  await act(async () => { window.dispatchEvent(new Event('focus')); });
  select('Thème', 'dark');
  expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(true);
  save(); expect(api.saveAppearance).not.toHaveBeenCalled();
  await act(async () => pending.resolve(fixtures.bootstrap({ appearance: fixtures.appearance({ font_family: 'Arial' }) })));
  expect(screen.getByLabelText('Thème').value).toBe('dark'); expect(screen.getByLabelText('Police de caractères').value).toBe('Arial');
  save(); await screen.findByText('Préférences enregistrées.');
  expect(api.saveAppearance).toHaveBeenCalledExactlyOnceWith({ theme: 'dark' });
});

it('offers a safe retry when an available source returns unusable preference values', async () => {
  api.loadSettings.mockResolvedValueOnce(fixtures.bootstrap({ appearance: { theme: 'unsupported', font_family: null, font_size: null, density: null } }));
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' }); tab('Apparence');
  expect(screen.getByLabelText('Thème').disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Actualiser les préférences' }));
  await waitFor(() => expect(screen.getByLabelText('Thème').disabled).toBe(false));
  expect(screen.getByLabelText('Thème').value).toBe('system');
  expect(api.saveAppearance).not.toHaveBeenCalled();
});

it('resets preference drafts and confirmations when a manual retry reads another account', async () => {
  api.loadSettings.mockResolvedValueOnce(fixtures.bootstrap({ sources: { sessions: 'unavailable' } }));
  render(<Home />); await screen.findByRole('tab', { name: 'Notifications' });
  tab('Notifications'); select('Messages', 'false'); save();
  await screen.findByText('Préférences enregistrées.');
  tab('Apparence'); select('Thème', 'dark');
  api.loadSettings.mockResolvedValueOnce(fixtures.bootstrap({
    profile: fixtures.profile({ email: 'another-account@mairie.test' }),
    appearance: fixtures.appearance({ theme: 'light' }),
    notifications: fixtures.notifications({ messages: true }),
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Actualiser les paramètres' }));
  await waitFor(() => expect(api.loadSettings).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.getByLabelText('Thème').value).toBe('light'));
  expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(true);
  expect(api.saveAppearance).not.toHaveBeenCalled();
  tab('Notifications'); expect(screen.getByLabelText('Messages').value).toBe('true');
  expect(screen.queryByText('Préférences enregistrées.')).toBeNull();
  expect(screen.getByRole('button', { name: 'Enregistrer les préférences' }).disabled).toBe(true);
});
