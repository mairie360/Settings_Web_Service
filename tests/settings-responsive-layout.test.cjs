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

test('Settings presentation includes the actual prototype spacing, typography and card shadow without global root changes', () => {
  assert.match(css, /\.settings-shell main\s*\{\s*padding: 32px/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.settings-shell main\s*\{\s*padding: 20px 14px/);
  assert.match(css, /\.settings-page\s*\{[^}]*font-size: 17px/);
  assert.match(css, /\.settings-panel > :is\(form, section\)\s*\{[^}]*box-shadow: 0 5px 15px rgb\(23 32 51 \/ 14%\)/);
  assert.doesNotMatch(css, /html\s*\{[^}]*font-size/);
});
