import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import SettingsTabIcon from '@/components/settings-tab-icon';

it.each(['profile', 'security', 'notifications', 'appearance', 'general', 'system'])('renders a decorative icon for the %s tab without an extra keyboard stop', name => {
  const { container } = render(<SettingsTabIcon name={name} />);
  const icon = container.querySelector('svg');
  expect(icon).not.toBeNull();
  expect(icon.getAttribute('aria-hidden')).toBe('true');
  expect(icon.getAttribute('focusable')).toBe('false');
  expect(icon.querySelector('path, circle, rect, line, polyline')).not.toBeNull();
});
