import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import Home from '@/components/SettingsPage';
import * as api from '@/lib/settings-api';
import fixtures from '../support/settings-fixtures.cjs';
import { findToastAlert, toastAlertText } from './page-alerts';

// MAIR-902 / MAIR-912 / MAIR-921: switches, lists and the slider save at once; « Langue et région » is a form.
vi.mock('@/lib/settings-api', () => ({ searchEverywhere: vi.fn(), loadTwoFactor: vi.fn(async () => ({ enabled: false, backup_codes_remaining: 0 })), loadSettings: vi.fn(), saveProfile: vi.fn(), saveAppearance: vi.fn(), saveGeneral: vi.fn(), saveNotifications: vi.fn() }));
const deferred = () => { let resolve; let reject; const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; }); return { promise, resolve, reject }; };
const tab = name => fireEvent.click(screen.getByRole('tab', { name, exact: true }));
const toggle = name => fireEvent.click(screen.getByRole('switch', { name }));
const checked = name => screen.getByRole('switch', { name }).getAttribute('aria-checked');
const select = (name, value) => fireEvent.change(screen.getByLabelText(name), { target: { value } });
const refresh = async body => {
  vi.mocked(api.loadSettings).mockResolvedValueOnce(body);
  await act(async () => { window.dispatchEvent(new Event('focus')); });
};
beforeEach(() => {
  for (const operation of Object.values(api)) operation.mockReset();
  api.loadTwoFactor.mockResolvedValue({ enabled: false, backup_codes_remaining: 0 });
  api.loadSettings.mockResolvedValue(fixtures.bootstrap());
  api.saveAppearance.mockResolvedValue(fixtures.appearance({ density: 'compact' }));
  api.saveGeneral.mockResolvedValue(fixtures.general({ home_page: '/projects' }));
  api.saveNotifications.mockResolvedValue(fixtures.notifications({ messages: false }));
});

it('hydrates persisted values, sends one field per change and shows the server confirmation as a toast', async () => {
  render(<Home />); await screen.findByRole('tab', { name: 'Notifications' });
  tab('Notifications'); expect(checked('Événements du calendrier')).toBe('false');
  toggle('Nouveaux messages');
  expect((await screen.findByRole('group', { name: /Option désactivée — Nouveaux messages/ }))).toBeTruthy();
  expect(api.saveNotifications).toHaveBeenCalledExactlyOnceWith({ messages: false });
  expect(api.saveAppearance).not.toHaveBeenCalled();
  tab('Apparence');
  fireEvent.click(screen.getByRole('radio', { name: 'Compacte' }));
  await waitFor(() => expect(api.saveAppearance).toHaveBeenCalledExactlyOnceWith({ density: 'compact' }));
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Compacte' }).getAttribute('aria-checked')).toBe('true'));
});

it('reads `null` as the account default and never sends a value the agent did not choose', async () => {
  api.loadSettings.mockResolvedValueOnce(fixtures.bootstrap({ appearance: null, general: null, notifications: null }));
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' }); tab('Apparence');
  expect(screen.getByLabelText('Police de caractères').value).toBe('system');
  expect(screen.getByRole('slider', { name: /Taille du texte/ }).value).toBe('16');
  tab('Général');
  expect(screen.getByLabelText('Langue').value).toBe('fr');
  expect(checked('Ouvrir automatiquement les notifications')).toBe('false');
  expect(screen.getByRole('button', { name: 'Enregistrer' }).disabled).toBe(true);
  tab('Notifications'); expect(checked('Nouveaux messages')).toBe('true');
  expect(api.saveAppearance).not.toHaveBeenCalled(); expect(api.saveGeneral).not.toHaveBeenCalled(); expect(api.saveNotifications).not.toHaveBeenCalled();
});

it('brings a switch back and shows « Enregistrement impossible. » when the save is refused or not confirmed', async () => {
  render(<Home />); await screen.findByRole('tab', { name: 'Notifications' }); tab('Notifications');
  api.saveNotifications.mockRejectedValueOnce(new Error('Validation refusée'));
  toggle('Nouveaux messages');
  expect(await findToastAlert()).toContain('Enregistrement impossible.');
  await waitFor(() => expect(checked('Nouveaux messages')).toBe('true'));
  api.saveNotifications.mockResolvedValueOnce({ email: 'yes' });
  toggle('Nouveaux messages');
  await waitFor(() => expect(api.saveNotifications).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(checked('Nouveaux messages')).toBe('true'));
  expect(toastAlertText()).toContain('Enregistrement impossible.');
});

it('locks an unavailable section with « Réessayer » and unlocks it when the source returns', async () => {
  render(<Home />); await screen.findByRole('tab', { name: 'Notifications' }); tab('Notifications');
  await refresh(fixtures.bootstrap({ notifications: null, sources: { notifications: 'unavailable' } }));
  expect(screen.getByRole('switch', { name: 'Nouveaux messages' }).disabled).toBe(true);
  expect(screen.getByText('Préférences indisponibles')).toBeTruthy();
  toggle('Nouveaux messages'); expect(api.saveNotifications).not.toHaveBeenCalled();
  api.loadSettings.mockResolvedValueOnce(fixtures.bootstrap());
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
  await waitFor(() => expect(screen.getByRole('switch', { name: 'Nouveaux messages' }).disabled).toBe(false));
});

it('keeps the other account safe when an earlier save settles after a foreground account change', async () => {
  const pending = deferred(); api.saveNotifications.mockReturnValueOnce(pending.promise);
  render(<Home />); await screen.findByRole('tab', { name: 'Notifications' }); tab('Notifications'); toggle('Nouveaux messages');
  // A focus event during a write must not start a competing bootstrap read.
  await act(async () => { window.dispatchEvent(new Event('focus')); }); expect(api.loadSettings).toHaveBeenCalledTimes(1);
  await act(async () => pending.resolve(fixtures.notifications({ messages: false })));
  await refresh(fixtures.bootstrap({ profile: fixtures.profile({ email: 'autre@mairie.test' }), notifications: fixtures.notifications({ messages: true }) }));
  await waitFor(() => expect(checked('Nouveaux messages')).toBe('true'));
});

it('does not commit a save after the page has been unmounted', async () => {
  const pending = deferred(); api.saveGeneral.mockReturnValueOnce(pending.promise);
  const view = render(<Home />); await screen.findByRole('tab', { name: 'Général' }); tab('Général');
  select('Page d’accueil', '/projects'); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
  expect(api.saveGeneral).toHaveBeenCalledExactlyOnceWith({ home_page: '/projects' });
  view.unmount(); render(<Home />); await screen.findByRole('tab', { name: 'Général' }); tab('Général');
  await act(async () => pending.resolve(fixtures.general({ home_page: '/projects' })));
  expect(screen.getByLabelText('Page d’accueil').value).toBe('/dashboard');
});

it('retains a confirmed preference when an unrelated profile save updates bootstrap', async () => {
  api.saveProfile.mockResolvedValueOnce(fixtures.profile({ first_name: 'Anne' }));
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' }); tab('Apparence');
  fireEvent.click(screen.getByRole('radio', { name: 'Compacte' }));
  await waitFor(() => expect(api.saveAppearance).toHaveBeenCalled());
  tab('Profil');
  fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Anne' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
  await screen.findByRole('group', { name: /Profil enregistré/ }); tab('Apparence');
  expect(screen.getByRole('radio', { name: 'Compacte' }).getAttribute('aria-checked')).toBe('true');
});

it('locks the controls during a foreground read and saves nothing until it ends', async () => {
  render(<Home />); await screen.findByRole('tab', { name: 'Général' }); tab('Général');
  select('Langue', 'en');
  const pending = deferred(); api.loadSettings.mockReturnValueOnce(pending.promise);
  await act(async () => { window.dispatchEvent(new Event('focus')); });
  expect(screen.getByRole('button', { name: 'Enregistrer' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' })); expect(api.saveGeneral).not.toHaveBeenCalled();
  await act(async () => pending.resolve(fixtures.bootstrap({ general: fixtures.general({ timezone: 'Indian/Reunion' }) })));
  expect(screen.getByLabelText('Langue').value).toBe('en'); expect(screen.getByLabelText('Fuseau horaire').value).toBe('Indian/Reunion');
  api.saveGeneral.mockResolvedValueOnce(fixtures.general({ language: 'en', timezone: 'Indian/Reunion' }));
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
  await screen.findByRole('group', { name: /Langue et région enregistrées/ });
  expect(api.saveGeneral).toHaveBeenCalledExactlyOnceWith({ language: 'en' });
});

it('offers a safe retry when an available source returns unusable preference values', async () => {
  api.loadSettings.mockResolvedValueOnce(fixtures.bootstrap({ appearance: { theme: 'unsupported', font_family: null, font_size: null, density: null } }));
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' }); tab('Apparence');
  expect(screen.getByLabelText('Police de caractères').disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
  await waitFor(() => expect(screen.getByLabelText('Police de caractères').disabled).toBe(false));
  expect(api.saveAppearance).not.toHaveBeenCalled();
});

it('resets the preferences when a manual retry reads another account', async () => {
  api.loadSettings.mockResolvedValueOnce(fixtures.bootstrap({ sources: { sessions: 'unavailable' } }));
  render(<Home />); await screen.findByRole('tab', { name: 'Notifications' });
  tab('Notifications'); toggle('Nouveaux messages');
  await waitFor(() => expect(checked('Nouveaux messages')).toBe('false'));
  api.loadSettings.mockResolvedValueOnce(fixtures.bootstrap({
    profile: fixtures.profile({ email: 'another-account@mairie.test' }),
    notifications: fixtures.notifications({ messages: true }),
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Actualiser les paramètres' }));
  await waitFor(() => expect(api.loadSettings).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(checked('Nouveaux messages')).toBe('true'));
});
