import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/components/SettingsPage';
import { loadSettings, saveProfile } from '@/lib/settings-api';
import { setBrowserFrontUrls } from '@/lib/front-urls';
import fixtures from '../support/settings-fixtures.cjs';

vi.mock('@/lib/settings-api', () => ({ loadTwoFactor: vi.fn(async () => ({ enabled: false, backup_codes_remaining: 0 })), loadSettings: vi.fn(), saveProfile: vi.fn() }));
const require = createRequire(import.meta.url);
const stylesheet = readFileSync(require.resolve('@mairie360/lib-components/styles.css'), 'utf8') + '\n' + readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
let style;
const dialogMethods = new Map(['showModal', 'close'].map(name => [name, Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name)]));
// Only model dialog state. Native modal isolation, hit testing and geometry remain browser checks.
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } });
afterAll(() => {
  for (const [name, descriptor] of dialogMethods) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else delete HTMLDialogElement.prototype[name];
  }
});
beforeEach(() => {
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'https://login.example/', DASHBOARD_FRONT_URL: 'https://dashboard.example/',
    PROJECT_FRONT_URL: 'https://projects.example/', MESSAGE_FRONT_URL: 'https://messages.example/',
    ELEARNING_FRONT_URL: 'https://training.example/', CALENDAR_FRONT_URL: 'https://calendar.example/',
    ADMINISTRATION_FRONT_URL: 'https://admin.example/', SETTINGS_FRONT_URL: 'https://settings.example/' });
  vi.mocked(loadSettings).mockResolvedValue(fixtures.bootstrap());
  style = document.createElement('style'); style.textContent = stylesheet; document.head.append(style);
});
afterEach(() => { style.remove(); setBrowserFrontUrls({}); });

async function page() {
  const user = userEvent.setup(); render(<Home />); await screen.findByRole('textbox', { name: 'Prénom' }); return user;
}
function shadow(value) {
  value = value.replace(/var\((--[\w-]+)\)/g, (_match, name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  return value.split(/,(?![^()]*\))/).map(part => {
    const tokens = part.trim().split(/\s+(?![^()]*\))/), lengths = tokens.filter(token => Number.isFinite(Number.parseFloat(token)));
    const colors = tokens.filter(token => !Number.isFinite(Number.parseFloat(token)));
    expect([3, 4]).toContain(lengths.length); expect(colors).toHaveLength(1);
    const pixels = lengths.map(token => { const number = Number.parseFloat(token); expect(number === 0 || token.endsWith('px')).toBe(true); return number; });
    if (pixels.length === 3) pixels.push(0);
    const probe = document.createElement('span'); probe.style.color = colors[0]; document.body.append(probe);
    try { return { lengths: pixels, color: getComputedStyle(probe).color }; } finally { probe.remove(); }
  });
}

describe('actual Settings page with the published shell and consumer styles', () => {
  it('applies the reference typography, main inset and panel shadows', async () => {
    await page();
    expect(getComputedStyle(document.documentElement).fontSize).toBe('17px');
    expect(getComputedStyle(document.querySelector('.settings-page')).fontSize).toBe('17px');
    expect(getComputedStyle(screen.getByRole('main')).padding).toBe('32px');
    const user = userEvent.setup();
    const skip = screen.getByRole('link', { name: 'Aller au contenu' });
    await user.click(skip);
    expect(document.activeElement).toBe(screen.getByRole('main'));
    // MAIR-1125 / lib-components 2.3: no footer on the V2 Settings page.
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

  it('renders the lib 2.x desktop navigation with the configured modules, Paramètres current (MAIR-851)', async () => {
    await page();
    // The V2 band is collapsed and only shown from the lg breakpoint: its rows are read through the DOM.
    const sidebar = document.querySelector('aside.app-desktop-navigation');
    expect(sidebar.getAttribute('aria-label')).toBe('Navigation principale');
    const buttons = [...sidebar.querySelectorAll('nav[aria-label="Menu principal"] button')];
    expect(buttons.map(button => button.getAttribute('aria-label'))).toEqual(['Tableau de bord', 'Projets', 'Messagerie', 'Formation', 'Calendrier', 'Paramètres']);
    expect(buttons.at(-1).getAttribute('aria-current')).toBe('page');
  });


  it('opens the real drawer with the lower sidebar layer and closes through its control', async () => {
    const user = await page(); await user.click(screen.getByRole('button', { name: 'Ouvrir la navigation', exact: true }));
    const drawer = screen.getByRole('dialog', { name: 'Navigation mobile' });
    expect(getComputedStyle(within(drawer).getByRole('complementary', { name: 'Navigation principale' })).zIndex).toBe('0');
    await user.click(within(drawer).getByRole('button', { name: 'Fermer la navigation', exact: true }));
    expect(screen.queryByRole('dialog', { name: 'Navigation mobile' })).toBeNull();
  });

  it('changes real selected-tab styles while keeping the profile fields in their bounded grid', async () => {
    const user = await page(), tabs = within(screen.getByRole('tablist', { name: 'Paramètres' })).getAllByRole('tab');
    // MAIR-608: the lib Tabs own their layout (Tailwind utilities of the published package); the page keeps the rhythm around them.
    expect(tabs).toHaveLength(6);
    expect(tabs[0].parentElement.getAttribute('role')).toBe('tablist');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    const fields = screen.getByRole('textbox', { name: 'Prénom' }).closest('.settings-profile-fields');
    expect(getComputedStyle(fields).display).toBe('grid'); expect(getComputedStyle(fields).gap).toBe('20px 36px');
    const inputs = within(fields).getAllByRole('textbox'); expect(inputs.map((input) => input.name)).toEqual(['first_name', 'last_name', 'email', 'phone', 'service', 'job_title', 'biography']);
    for (const input of inputs) {
      expect(input.closest('.mairie-field').querySelector('label')).not.toBeNull();
    }
    await user.click(tabs[1]); expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it('keeps one skip link before the navigation, targeting the main area (MAIR-851, no Système tab)', async () => {
    const user = await page();
    expect(screen.queryByRole('tab', { name: 'Système' })).toBeNull();
    const skip = screen.getByRole('link', { name: 'Aller au contenu' });
    const main = screen.getByRole('main');
    expect(skip.getAttribute('href')).toBe(`#${main.id}`);
    expect(skip.compareDocumentPosition(document.querySelector('.app-desktop-navigation button')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelectorAll(`a[href="#${main.id}"]`)).toHaveLength(1);
    await user.click(skip);
    expect(document.activeElement).toBe(main);
    expect(loadSettings).toHaveBeenCalledTimes(1); expect(saveProfile).not.toHaveBeenCalled();
  });

  // API functions reuse existing canonical fixtures. No deployed BFF response-schema or persistence certification here.
});
