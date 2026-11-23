import { fireEvent, render, screen, act } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import Home from '@/components/SettingsPage';
import { DesktopNavigation } from '@mairie360/lib-components/shell';
import { loadSettings, saveProfile } from '@/lib/settings-api';

vi.mock('@/lib/settings-api', () => ({ loadTwoFactor: vi.fn(async () => ({ enabled: false, backup_codes_remaining: 0 })), loadSettings:vi.fn(), saveProfile:vi.fn() }));
const bootstrap = { profile:{first_name:'Test',last_name:'User',email:'test@example.invalid',phone:null}, sessions:[], sources:{sessions:'available'} };

it('opens a validated tab link and restores it on history navigation without another bootstrap', async () => {
  loadSettings.mockResolvedValue(bootstrap);
  window.history.replaceState({}, '', '/?tab=security&event=12#detail');
  render(<Home />);
  await screen.findByRole('tab', {name:'Sécurité', selected:true});
  expect(window.location.search).toContain('event=12');
  fireEvent.click(screen.getByRole('tab', {name:'Profil'}));
  const name = await screen.findByRole('textbox', {name:'Prénom'});
  fireEvent.change(name, {target:{value:'Brouillon'}});
  act(() => { window.history.replaceState({}, '', '/?tab=security&event=12#detail'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await screen.findByRole('tab', {name:'Sécurité', selected:true});
  fireEvent.click(screen.getByRole('tab', {name:'Profil'}));
  expect((await screen.findByRole('textbox', {name:'Prénom'})).value).toBe('Brouillon');
  expect(loadSettings).toHaveBeenCalledTimes(1);
  expect(saveProfile).not.toHaveBeenCalled();
});


it('does not expose unsafe module URLs or administration without the role', () => {
  const {container} = render(<DesktopNavigation isAdmin={false} hrefs={{settings:'/',admin:'/admin',projects:'javascript:alert(1)',calendar:'https://name:private@example.test/'}} onCollapsedChange={vi.fn()} />);
  expect(container.querySelectorAll('nav button')).toHaveLength(1);
  expect(container.querySelector('nav button').getAttribute('aria-label')).toBe('Paramètres');
});
