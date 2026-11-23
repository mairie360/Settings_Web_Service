import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import Home from '@/components/SettingsPage';
import * as api from '@/lib/settings-api';
import fixtures from '../support/settings-fixtures.cjs';
vi.mock('@/lib/settings-api', () => ({ loadSettings: vi.fn(), saveProfile: vi.fn(), saveAppearance: vi.fn(), saveGeneral: vi.fn(), saveNotifications: vi.fn() }));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-density');
  document.documentElement.style.removeProperty('--mairie-user-font');
  document.cookie = 'mairie360_appearance=; Path=/; Max-Age=0';
  for (const method of Object.values(api)) method.mockReset();
  api.loadSettings.mockResolvedValue(fixtures.bootstrap({ appearance: fixtures.appearance({ theme: 'light', density: 'normal', font_family: 'Arial' }) }));
});
it('applies and caches only the confirmed bootstrap and write receipt, never a pending value', async () => {
  const response = deferred(); api.saveAppearance.mockReturnValueOnce(response.promise);
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' });
  await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
  expect(document.cookie).toContain('mairie360_appearance=');
  const cookie = document.cookie;
  fireEvent.click(screen.getByRole('tab', { name: 'Apparence', exact: true }));
  fireEvent.click(screen.getByRole('radio', { name: 'Confortable' }));
  expect(document.documentElement.dataset.density).toBe('normal'); expect(document.cookie).toBe(cookie);
  await act(async () => response.resolve(fixtures.appearance({ theme: 'dark', density: 'comfortable', font_family: 'Georgia, serif', font_size: 32767 })));
  await screen.findByRole('group', { name: /Densité enregistrée/ });
  // MAIR-851 / MAIR-933: the interface stays light whatever theme is stored.
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(document.documentElement.dataset.density).toBe('comfortable');
  expect(document.documentElement.style.getPropertyValue('--mairie-user-font')).toBe('Georgia, serif');
  expect(document.cookie).not.toMatch(/32767|font_size/);
  expect(document.documentElement.style.fontSize).toBe('');
});
it('does not cache malformed receipts or an unavailable preference source', async () => {
  api.loadSettings.mockResolvedValueOnce(fixtures.bootstrap({ appearance: null, sources: { preferences: 'unavailable' } }));
  const view = render(<Home />); await screen.findByRole('tab', { name: 'Apparence' });
  expect(document.cookie).not.toContain('mairie360_appearance=');
  view.unmount(); render(<Home />); await screen.findByRole('tab', { name: 'Apparence' });
  await waitFor(() => expect(document.documentElement.dataset.density).toBe('normal'));
  const before = document.cookie;
  fireEvent.click(screen.getByRole('tab', { name: 'Apparence', exact: true }));
  api.saveAppearance.mockResolvedValueOnce({ theme: 'dark', font_family: 'Arial', font_size: 'invalid', density: 'compact' });
  fireEvent.click(screen.getByRole('radio', { name: 'Compacte' }));
  await waitFor(() => expect(api.saveAppearance).toHaveBeenCalled());
  await waitFor(() => expect(document.querySelector('[data-m360-component~="ToastProvider"][role="alert"]')?.textContent).toContain('Enregistrement impossible.'));
  expect(document.documentElement.dataset.density).toBe('normal'); expect(document.cookie).toBe(before);
});
it('keeps appearance controls keyboard accessible and bounds the text size to the slider range', async () => {
  const user = userEvent.setup();
  api.loadSettings.mockResolvedValue(fixtures.bootstrap({ appearance: fixtures.appearance({ font_size: 32767 }) }));
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' });
  fireEvent.click(screen.getByRole('tab', { name: 'Apparence', exact: true }));
  const font = screen.getByLabelText('Police de caractères'); font.focus(); await user.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(font);
  expect(screen.getByRole('slider', { name: /Taille du texte/ }).value).toBe('24');
  expect(document.documentElement.style.fontSize).toBe('');
});

it('MAIR-851: stays light with a dark system preference and with a stored dark theme', async () => {
  const media = Object.assign(new EventTarget(), { matches: true });
  const original = window.matchMedia;
  window.matchMedia = () => media;
  try {
    api.loadSettings.mockResolvedValue(fixtures.bootstrap({ appearance: fixtures.appearance({ theme: 'dark', density: 'compact', font_family: 'Arial' }) }));
    render(<Home />); await screen.findByRole('tab', { name: 'Apparence' });
    await waitFor(() => expect(document.documentElement.dataset.density).toBe('compact'));
    expect(document.documentElement.dataset.theme).toBe('light');
    act(() => { media.matches = true; media.dispatchEvent(new Event('change')); });
    expect(document.documentElement.dataset.theme).toBe('light');
  } finally { window.matchMedia = original; }
});
