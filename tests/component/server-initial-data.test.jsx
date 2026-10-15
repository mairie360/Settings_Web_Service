import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import Home from '@/components/settings-page';
import { loadSettings, saveProfile } from '@/lib/settings-api';
import fixtures from '../support/settings-fixtures.cjs';

vi.mock('@/lib/settings-api', () => ({ loadSettings: vi.fn(), saveProfile: vi.fn() }));
beforeEach(() => { vi.mocked(loadSettings).mockReset().mockResolvedValue(fixtures.bootstrap()); });

it('renders the confirmed server profile immediately without a duplicate StrictMode bootstrap', async () => {
  render(<StrictMode><Home initialData={fixtures.bootstrap()} /></StrictMode>);
  expect(screen.getByRole('textbox', { name: 'Prénom' }).value).toBe('Anne Marie');
  expect(loadSettings).not.toHaveBeenCalled();
  expect(screen.queryByText('Chargement des paramètres…')).toBeNull();
  fireEvent.change(screen.getByRole('textbox', { name: 'Prénom' }), { target: { value: 'Pending draft' } });
  vi.mocked(loadSettings).mockResolvedValueOnce(fixtures.bootstrap({ profile: fixtures.profile({ last_name: 'Confirmed surname' }) }));
  await act(async () => fireEvent.focus(window));
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Nom' }).value).toBe('Confirmed surname'));
  expect(screen.getByRole('textbox', { name: 'Prénom' }).value).toBe('Pending draft');
  expect(loadSettings).toHaveBeenCalledOnce();
  expect(saveProfile).not.toHaveBeenCalled();
});

it('keeps the same-origin recovery path when there is no confirmed server seed', async () => {
  render(<Home initialData={null} />);
  await screen.findByRole('textbox', { name: 'Prénom' });
  expect(loadSettings).toHaveBeenCalledOnce();
});


it('keeps personal data and preferences out of native GET submissions in every settings section', () => {
  render(<Home initialData={fixtures.bootstrap()} />);
  expect(document.querySelector('input[name="email"]').form.method).toBe('post');
  for (const name of ['Apparence', 'Général', 'Notifications']) {
    fireEvent.click(screen.getByRole('tab', { name, exact: true }));
    const forms = [...document.querySelectorAll('form')];
    expect(forms.length).toBeGreaterThan(0);
    expect(forms.every(form => form.method === 'post')).toBe(true);
  }
});
