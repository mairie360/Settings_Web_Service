import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import { loadSettings, saveProfile } from '@/lib/settings-api';
import { setBrowserFrontUrls } from '@/lib/front-urls';
import fixtures from '../support/settings-fixtures.cjs';

vi.mock('@/lib/settings-api', () => ({ loadSettings: vi.fn(), saveProfile: vi.fn() }));
const stylesheet = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
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
    expect(getComputedStyle(document.body).fontFamily).toBe('system-ui, sans-serif');
    expect(getComputedStyle(document.querySelector('.settings-page')).fontSize).toBe('17px');
    expect(getComputedStyle(screen.getByRole('main')).padding).toBe('32px');
    expect(shadow(getComputedStyle(screen.getByRole('tabpanel').firstElementChild).boxShadow)).toEqual([
      { lengths: [0, 5, 15, 0], color: 'rgba(23, 32, 51, 0.14)' }, { lengths: [0, 1, 3, 0], color: 'rgba(23, 32, 51, 0.12)' },
    ]);
  });

  it('applies the reference sidebar rows and shadow to the actual published navigation', async () => {
    await page(); const sidebar = screen.getByRole('complementary', { name: 'Navigation principale' });
    const computed = getComputedStyle(sidebar); expect(computed.position).toBe('relative'); expect(computed.zIndex).toBe('20');
    expect(shadow(computed.boxShadow)).toEqual([{ lengths: [8, 0, 24, 0], color: 'rgba(12, 28, 48, 0.28)' }]);
    const buttons = within(within(sidebar).getByRole('navigation', { name: 'Menu principal' })).getAllByRole('button');
    expect(buttons.map(button => button.textContent)).toEqual(['Tableau de bord', 'Projets', 'Messagerie', 'Formation', 'Calendrier', 'Paramètres']);
    for (const button of buttons) { expect(getComputedStyle(button).minHeight).toBe('44px'); expect(getComputedStyle(button).flexShrink).toBe('0'); }
  });

  it('opens the real drawer with the lower sidebar layer and closes through its control', async () => {
    const user = await page(); await user.click(screen.getByRole('button', { name: 'Ouvrir la navigation', exact: true }));
    const drawer = screen.getByRole('dialog', { name: 'Navigation mobile' });
    expect(getComputedStyle(within(drawer).getByRole('complementary', { name: 'Navigation principale' })).zIndex).toBe('0');
    await user.click(within(drawer).getByRole('button', { name: 'Fermer la navigation', exact: true }));
    expect(screen.queryByRole('dialog', { name: 'Navigation mobile' })).toBeNull();
  });

  it('changes real selected-tab styles while keeping the four profile fields in their bounded grid', async () => {
    const user = await page(), tabs = within(screen.getByRole('tablist', { name: 'Paramètres' })).getAllByRole('tab');
    expect(getComputedStyle(tabs[0].parentElement).display).toBe('grid');
    expect(getComputedStyle(tabs[0].parentElement).gridTemplateColumns.replace(/\s+/g, '')).toBe('repeat(2,minmax(0,1fr))');
    for (const tab of tabs) expect(Number.parseFloat(getComputedStyle(tab).minWidth)).toBe(0);
    expect(getComputedStyle(tabs[0]).backgroundColor).toBe('rgb(255, 255, 255)'); expect(getComputedStyle(tabs[0]).color).toBe('rgb(18, 86, 166)');
    const fields = screen.getByRole('textbox', { name: 'Prénom' }).closest('.settings-profile-fields');
    expect(getComputedStyle(fields).display).toBe('grid'); expect(getComputedStyle(fields).gap).toBe('17px');
    const inputs = within(fields).getAllByRole('textbox'); expect(inputs).toHaveLength(4);
    for (const input of inputs) {
      expect(Number.parseFloat(getComputedStyle(input.closest('label')).minWidth)).toBe(0);
      expect(getComputedStyle(input).backgroundColor).toBe('rgb(248, 250, 252)');
    }
    await user.click(tabs[1]); expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(getComputedStyle(tabs[1]).backgroundColor).toBe('rgb(255, 255, 255)'); expect(getComputedStyle(tabs[0]).color).toBe('rgb(63, 69, 76)');
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it('opens bounded assistance content and closes it through the actual command', async () => {
    const user = await page(); await user.click(screen.getByRole('tab', { name: 'Système', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Centre d’aide', exact: true }));
    const dialog = screen.getByRole('dialog', { name: 'Centre d’aide' }); const computed = getComputedStyle(dialog);
    expect(computed.width.replace(/\s+/g, '')).toBe('min(600px,100%-32px)');
    expect(computed.maxHeight.replace(/\s+/g, '')).toBe('calc(100dvh-32px)'); expect(computed.overflow).toBe('auto');
    await user.click(within(dialog).getByRole('button', { name: 'Fermer', exact: true })); expect(screen.queryByRole('dialog')).toBeNull();
    expect(loadSettings).toHaveBeenCalledTimes(1); expect(saveProfile).not.toHaveBeenCalled();
  });
  // API functions reuse existing canonical fixtures. No deployed BFF response-schema or persistence certification here.
});
