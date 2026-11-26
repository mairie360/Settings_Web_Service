import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import { SettingsTabs, settingsPanelId, settingsTabId } from './SettingsTabs';
import { settingsTabs, tabFromUrl, tabToUrl } from './settings-tabs';

describe('Settings tabs (lib Tabs, MAIR-608, MAIR-851)', () => {
  it('maps the historical URL values and renders the six V2 tabs with stable ids owning the host panel', async () => {
    expect(tabFromUrl('notification-preferences')).toBe('notifications'); expect(tabFromUrl('profile')).toBe('profile'); expect(tabFromUrl('sessions')).toBe('sessions');
    // The removed « Système » tab (and any unknown value) falls back to Profil.
    expect(tabFromUrl('system')).toBe('profile'); expect(tabFromUrl('system-assistance')).toBe('profile'); expect(tabFromUrl('anything')).toBe('profile');
    expect(tabToUrl('notifications')).toBe('notification-preferences'); expect(tabToUrl('sessions')).toBe('sessions'); expect(tabToUrl('general')).toBe('general');
    expect(settingsTabs.map((tab) => tab.id)).toEqual(['profile', 'security', 'sessions', 'notifications', 'appearance', 'general']);
    const onChange = vi.fn(); const user = userEvent.setup();
    const { container } = render(<><SettingsTabs value="profile" onChange={onChange} /><div role="tabpanel" id={settingsPanelId('profile')} aria-labelledby={settingsTabId('profile')}>Contenu</div></>);
    const tabs = within(screen.getByRole('tablist', { name: 'Paramètres' })).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(settingsTabs.map((tab) => tab.label));
    expect((tabs[0]).getAttribute('aria-controls')).toBe('settings-panel-profile'); expect((tabs[1]).hasAttribute('aria-controls')).toBe(false);
    for (const tab of tabs) expect(tab.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    await user.click(tabs[2]); expect(onChange).toHaveBeenCalledWith('sessions');
    expect((await axe(container)).violations).toEqual([]);
  });

  it('MAIR-1227 shows the underlined tabs of the mock-up, not a floating pill bar', () => {
    const { container } = render(<SettingsTabs value="profile" onChange={vi.fn()} />);
    const root = container.querySelector('[data-m360-component="Tabs"]');
    expect(root.getAttribute('data-variant')).toBe('underline');
    expect(root.hasAttribute('data-sticky')).toBe(false);
  });
});
