const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const css = readFileSync(path.join(__dirname, '../src/app/globals.css'), 'utf8');

test('Settings tabs preserve prototype two/three/six-column responsive breakpoints', () => {
  assert.match(css, /\.settings-tabs\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(min-width: 640px\)[\s\S]*?\.settings-tabs\s*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(min-width: 1024px\)[\s\S]*?\.settings-tabs\s*\{[^}]*repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.settings-tab\[aria-selected="true"\]\s*\{[^}]*background: white; color: #1256a6/);
  assert.match(css, /\.settings-tab\s*\{[^}]*min-width: 0/);
});

test('only existing Settings profile fields form a bounded desktop grid with visible focus', () => {
  assert.match(css, /\.settings-profile-fields\s*\{[^}]*display: grid; gap: 17px/);
  assert.match(css, /@media \(min-width: 1024px\)[\s\S]*?\.settings-profile-fields\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.settings-profile-fields label\s*\{[^}]*min-width: 0/);
  assert.match(css, /\.settings-page :is\(button, input, textarea, summary\):focus-visible\s*\{[^}]*outline: 2px solid #1256a6/);
  assert.match(css, /\.settings-profile-fields input\s*\{[^}]*background: #f8fafc/);
});

test('Settings presentation includes the actual prototype spacing, typography and card shadow', () => {
  assert.match(css, /\.settings-shell main\s*\{\s*padding: 32px/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.settings-shell main\s*\{\s*padding: 20px 14px/);
  assert.match(css, /\.settings-page\s*\{[^}]*font-size: 17px/);
  assert.match(css, /\.settings-panel > :is\(form, section\)\s*\{[^}]*box-shadow: 0 5px 15px rgb\(23 32 51 \/ 14%\)/);
});

test('Settings shared navigation inherits the prototype default type scale without a fixed header override', () => {
  assert.match(css, /html\s*\{\s*font-size: 17px;/);
  assert.match(css, /@theme inline\s*\{[^}]*--font-sans: system-ui, sans-serif;/);
  assert.match(css, /@theme inline\s*\{[^}]*--text-xs: \.8125rem;/);
  assert.match(css, /@theme inline\s*\{[^}]*--text-sm: \.9375rem;/);
  assert.match(css, /body\s*\{[^}]*font-family: system-ui, sans-serif;/);
  assert.doesNotMatch(css, /(?:header|\.h-16)\s*\{[^}]*(?:height|min-height|max-height):/);
});
