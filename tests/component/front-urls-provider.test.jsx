import { render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { FrontUrlsProvider } from '@/lib/front-urls-provider';
import { getActiveFrontHrefs } from '@/lib/navigation';
import { setBrowserFrontUrls } from '@/lib/front-urls';
import { configureSidebarCookieDomain, sidebarPreferenceCookie } from '@/lib/sidebar-preference';

function RuntimeLink() { return <a href={getActiveFrontHrefs().projects}>Projects</a>; }
afterEach(() => { setBrowserFrontUrls({}); configureSidebarCookieDomain(undefined); });
it('provides runtime destinations before rendering child navigation and updates them on rerender', () => {
  const { rerender } = render(<FrontUrlsProvider urls={{ PROJECT_FRONT_URL: 'https://projects.mairie.test' }} cookieDomain=".mairie.test"><RuntimeLink /></FrontUrlsProvider>);
  expect(screen.getByRole('link', { name: 'Projects' }).href).toBe('https://projects.mairie.test/');
  expect(sidebarPreferenceCookie(true, 'settings.mairie.test', 'https:')).toContain('; Domain=mairie.test');
  rerender(<FrontUrlsProvider urls={{ PROJECT_FRONT_URL: 'https://projects.other.test' }}><RuntimeLink /></FrontUrlsProvider>);
  expect(screen.getByRole('link', { name: 'Projects' }).href).toBe('https://projects.other.test/');
  expect(sidebarPreferenceCookie(true, 'settings.mairie.test', 'https:')).not.toContain('; Domain=');
});
