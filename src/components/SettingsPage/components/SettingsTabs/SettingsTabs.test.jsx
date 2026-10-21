import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import { SettingsTabs, settingsPanelId, settingsTabId } from './SettingsTabs';
import { settingsTabs, tabFromUrl, tabToUrl } from './settings-tabs';

describe('Settings tabs (lib Tabs, MAIR-608)', () => {
  it('maps the historical URL values and renders six tabs with stable ids owning the host panel', async () => {
    expect(tabFromUrl('notification-preferences')).toBe('notifications'); expect(tabFromUrl('system-assistance')).toBe('system'); expect(tabFromUrl('profile')).toBe('profile');
    expect(tabToUrl('notifications')).toBe('notification-preferences'); expect(tabToUrl('system')).toBe('system-assistance'); expect(tabToUrl('general')).toBe('general');
    const onChange = vi.fn(); const user = userEvent.setup();
    const { container } = render(<><SettingsTabs value="profile" onChange={onChange} /><div role="tabpanel" id={settingsPanelId('profile')} aria-labelledby={settingsTabId('profile')}>Contenu</div></>);
    const tabs = within(screen.getByRole('tablist', { name: 'Paramètres' })).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(settingsTabs.map((tab) => tab.label));
    expect((tabs[0]).getAttribute('aria-controls')).toBe('settings-panel-profile'); expect((tabs[1]).hasAttribute('aria-controls')).toBe(false);
    for (const tab of tabs) expect(tab.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    await user.click(tabs[2]); expect(onChange).toHaveBeenCalledWith('notifications');
    expect((await axe(container)).violations).toEqual([]);
  });
});
