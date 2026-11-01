import { fireEvent, render, screen, act } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import Home from '@/components/SettingsPage';
import { DesktopNavigation } from '@mairie360/lib-components/shell';
import { loadSettings, saveProfile } from '@/lib/settings-api';

vi.mock('@/lib/settings-api', () => ({ loadSettings:vi.fn(), saveProfile:vi.fn() }));
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

it('persists collapse, exposes tooltip names and dismisses them with Escape', () => {
  const onCollapsedChange = vi.fn();
  const onNavigate = vi.fn();
  const {container, unmount} = render(<DesktopNavigation hrefs={{settings:'/settings'}} onNavigate={onNavigate} onCollapsedChange={onCollapsedChange} />);
  const toggle = container.querySelector('button[aria-expanded]');
  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(document.cookie).toContain('mairie360_sidebar=v1:collapsed');
  const settings = container.querySelector('button[aria-label="Paramètres"]');
  fireEvent.focus(settings);
  const tooltip = container.querySelector('[role="tooltip"]');
  expect(tooltip.textContent).toBe('Paramètres');
  expect(settings.getAttribute('aria-describedby')).toBe(tooltip.id);
  fireEvent.keyDown(settings, {key:'Escape'});
  expect(container.querySelector('[role="tooltip"]')).toBeNull();
  fireEvent.click(settings);
  expect(onNavigate).toHaveBeenCalledExactlyOnceWith('/settings', 'settings');
  unmount();
  const restored = render(<DesktopNavigation hrefs={{settings:'/settings'}} onCollapsedChange={onCollapsedChange} />);
  expect(restored.container.querySelector('button[aria-expanded]').getAttribute('aria-expanded')).toBe('false');
});

it('does not expose unsafe module URLs or administration without the role', () => {
  const {container} = render(<DesktopNavigation isAdmin={false} hrefs={{settings:'/',admin:'/admin',projects:'javascript:alert(1)',calendar:'https://name:private@example.test/'}} onCollapsedChange={vi.fn()} />);
  expect(container.querySelectorAll('nav button')).toHaveLength(1);
  expect(container.querySelector('nav button').getAttribute('aria-label')).toBe('Paramètres');
});
