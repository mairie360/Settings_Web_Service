import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import Home from '@/app/page';
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
it('applies and caches only the confirmed bootstrap and write receipt, keeping the draft local while pending', async () => {
  const response = deferred(); api.saveAppearance.mockReturnValueOnce(response.promise);
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' });
  await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
  expect(document.cookie).toContain('mairie360_appearance=');
  const cookie = document.cookie;
  fireEvent.click(screen.getByRole('tab', { name: 'Apparence', exact: true }));
  fireEvent.change(screen.getByLabelText('Thème'), { target: { value: 'dark' } });
  expect(document.documentElement.dataset.theme).toBe('light'); expect(document.cookie).toBe(cookie);
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les préférences', exact: true }));
  expect(document.documentElement.dataset.theme).toBe('light'); expect(screen.queryByText('Préférences enregistrées.')).toBeNull();
  await act(async () => response.resolve(fixtures.appearance({ theme: 'dark', density: 'comfortable', font_family: 'Georgia, serif', font_size: 32767 })));
  await screen.findByText('Préférences enregistrées.');
  expect(document.documentElement.dataset.theme).toBe('dark');
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
  await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
  const before = document.cookie;
  fireEvent.click(screen.getByRole('tab', { name: 'Apparence', exact: true }));
  fireEvent.change(screen.getByLabelText('Thème'), { target: { value: 'dark' } });
  api.saveAppearance.mockResolvedValueOnce({ theme: 'dark', font_family: 'Arial', font_size: 'invalid', density: 'normal' });
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les préférences', exact: true }));
  await screen.findByRole('alert');
  expect(document.documentElement.dataset.theme).toBe('light'); expect(document.cookie).toBe(before);
});
it('keeps appearance controls keyboard accessible and confines extreme font sizes to a bounded preview', async () => {
  const user = userEvent.setup();
  render(<Home />); await screen.findByRole('tab', { name: 'Apparence' });
  fireEvent.click(screen.getByRole('tab', { name: 'Apparence', exact: true }));
  const theme = screen.getByLabelText('Thème'); theme.focus(); await user.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(theme);
  fireEvent.change(screen.getByLabelText('Taille de police (px)'), { target: { value: '32767' } });
  const preview = screen.getByLabelText('Aperçu de l’apparence');
  expect(preview.style.fontSize).toBe('24px');
  expect(document.documentElement.style.fontSize).toBe('');
});

it('follows system colour changes through the distributed provider and retains an explicit confirmed theme', async () => {
  const { InstanceProvider } = await import('@mairie360/front-kit/react');
  const { applyConfirmedAppearance } = await import('@mairie360/front-kit/theme');
  const media = Object.assign(new EventTarget(), { matches: false });
  const original = window.matchMedia;
  window.matchMedia = () => media;
  try {
    const user = userEvent.setup();
    const view = render(<InstanceProvider role="User" timeZone="Indian/Reunion" appearance={{ theme: 'system', density: null, font_family: null }}><button type="button" onClick={() => applyConfirmedAppearance({ theme: 'light', density: 'compact', font_family: null })}>Confirmer le thème clair</button></InstanceProvider>);
    expect(document.documentElement.dataset.theme).toBe('light');
    act(() => { media.matches = true; media.dispatchEvent(new Event('change')); });
    expect(document.documentElement.dataset.theme).toBe('dark');
    screen.getByRole('button', { name: 'Confirmer le thème clair' }).focus(); await user.keyboard('{Enter}');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.density).toBe('compact');
    act(() => { media.matches = false; media.dispatchEvent(new Event('change')); media.matches = true; media.dispatchEvent(new Event('change')); });
    expect(document.documentElement.dataset.theme).toBe('light');
    view.unmount(); document.documentElement.dataset.theme = 'unmounted';
    act(() => media.dispatchEvent(new Event('change')));
    expect(document.documentElement.dataset.theme).toBe('unmounted');
  } finally { window.matchMedia = original; }
});
