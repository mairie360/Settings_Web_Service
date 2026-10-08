import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import { loadSettings, saveProfile } from '@/lib/settings-api';
import fixtures from '../support/settings-fixtures.cjs';

vi.mock('@/lib/settings-api', () => ({ loadSettings: vi.fn(), saveProfile: vi.fn() }));
const message = 'Les paramètres reçus sont incohérents. Réessayez.';
const valid = () => fixtures.bootstrap({ sessions: [], sources: { sessions: 'unavailable' } });
const deferred = () => { let resolve; const promise = new Promise(ok => { resolve = ok; }); return { promise, resolve }; };

beforeEach(() => {
  vi.mocked(loadSettings).mockReset().mockResolvedValue(valid());
  vi.mocked(saveProfile).mockReset().mockImplementation(async patch => ({ ...fixtures.profile(), ...patch }));
});

it.each([
  ['null', null],
  ['body-less', undefined],
  ['incomplete profile', fixtures.bootstrap({ profile: { last_name: 'Unverified', email: 'unverified@example.invalid' } })],
  ['sessions object', fixtures.bootstrap({ sessions: {} })],
  ['unknown source', fixtures.bootstrap({ sources: { sessions: 'partial' } })],
])('rejects an initial %s bootstrap without raw errors, fake tabs or an automatic request', async (name, body) => {
  vi.mocked(loadSettings).mockResolvedValueOnce(body);
  render(<Home />);
  expect((await screen.findByRole('alert')).textContent).toBe(message);
  expect(screen.getByText('Le profil est indisponible.')).toBeTruthy();
  expect(screen.queryByRole('tablist')).toBeNull();
  expect(screen.queryByRole('textbox', { name: 'Prénom' })).toBeNull();
  expect(loadSettings).toHaveBeenCalledOnce();
  expect(saveProfile).not.toHaveBeenCalled();
  await userEvent.setup().click(screen.getByRole('button', { name: 'Réessayer', exact: true }));
  await screen.findByRole('textbox', { name: 'Prénom' });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(loadSettings).toHaveBeenCalledTimes(2);
  expect(saveProfile).not.toHaveBeenCalled();
});

it('keeps the confirmed profile and pending draft through an unusable refresh, then merges a valid GET against the unchanged baseline', async () => {
  const user = userEvent.setup(); render(<Home />);
  const phone = await screen.findByRole('textbox', { name: 'Téléphone' });
  await user.clear(phone); await user.type(phone, '+33999999999');
  const pending = deferred(); vi.mocked(loadSettings).mockReturnValueOnce(pending.promise);
  await user.click(screen.getByRole('button', { name: 'Actualiser les paramètres', exact: true }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Prénom' }), { target: { value: 'Dernière saisie' } });
  await user.click(screen.getByRole('tab', { name: 'Sécurité', exact: true }));
  await act(async () => pending.resolve(fixtures.bootstrap({ profile: { last_name: 'Unverified', email: 'unverified@example.invalid' }, sessions: [], sources: { sessions: 'available' } })));
  expect((await screen.findByRole('alert')).textContent).toBe(message);
  expect(screen.getByText('Les sessions sont temporairement indisponibles.')).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'Sécurité', exact: true }).getAttribute('aria-selected')).toBe('true');
  await user.click(screen.getByRole('tab', { name: 'Profil', exact: true }));
  expect(screen.getByRole('textbox', { name: 'Prénom' }).value).toBe('Dernière saisie');
  expect(screen.getByRole('textbox', { name: 'Nom' }).value).toBe('Le Gall');
  expect(screen.getByRole('textbox', { name: 'E-mail' }).value).toBe(fixtures.profile().email);
  expect(screen.getByRole('textbox', { name: 'Téléphone' }).value).toBe('+33999999999');
  expect(screen.queryByText('Unverified')).toBeNull();
  vi.mocked(loadSettings).mockResolvedValueOnce(fixtures.bootstrap({ profile: fixtures.profile({ last_name: 'Nom confirmé' }), sessions: [], sources: { sessions: 'available' } }));
  const retry = screen.getByRole('button', { name: 'Actualiser les paramètres', exact: true });
  retry.focus(); await user.keyboard('{Enter}');
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(screen.getByRole('textbox', { name: 'Nom' }).value).toBe('Nom confirmé');
  expect(screen.getByRole('textbox', { name: 'Prénom' }).value).toBe('Dernière saisie');
  expect(screen.getByRole('textbox', { name: 'Téléphone' }).value).toBe('+33999999999');
  expect(loadSettings).toHaveBeenCalledTimes(3);
  expect(saveProfile).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
  expect(saveProfile).toHaveBeenCalledExactlyOnceWith({ first_name: 'Dernière saisie', phone: '+33999999999' });
});
