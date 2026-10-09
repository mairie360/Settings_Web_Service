const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const postcss = createRequire(require.resolve('next/package.json'))('postcss');
const { JSDOM } = require('jsdom');

const select = text => text.replace(/\s+/g, ' ').trim();
const compact = text => text.replace(/\s+/g, '');
function policy() {
  const parsed = postcss.parse(readFileSync(path.join(__dirname, '../src/app/globals.css'), 'utf8'));
  const rows = [];
  parsed.walkRules(rule => {
    const media = [];
    for (let parent = rule.parent; parent; parent = parent.parent) if (parent.type === 'atrule' && parent.name === 'media') media.unshift(compact(parent.params));
    rows.push({ rule, selectors: rule.selectors.map(select), media: media.join(' and ') || null });
  });
  const declaration = (selector, property, media = null) => {
    let found;
    for (const row of rows.filter(row => row.selectors.includes(select(selector)) && row.media === (media ? compact(media) : null))) {
      row.rule.walkDecls(property, decl => { found = decl.value; });
    }
    assert.ok(found, `Keep ${selector} / ${property} / ${media || 'base'}`); return found;
  };
  return { parsed, rows, declaration };
}

test('parsed media policies retain two/three/six tabs, desktop profile columns and mobile main inset', () => {
  const { declaration } = policy();
  for (const [media, columns] of [[null, 2], ['(min-width: 640px)', 3], ['(min-width: 1024px)', 6]]) {
    assert.equal(compact(declaration('.settings-tabs', 'grid-template-columns', media)), `repeat(${columns},minmax(0,1fr))`);
  }
  assert.equal(compact(declaration('.settings-profile-fields', 'grid-template-columns', '(min-width: 1024px)')), 'repeat(2,minmax(0,1fr))');
  assert.equal(declaration('.settings-shell main', 'padding', '(max-width: 767px)').replace(/\s+/g, ' '), '20px 14px');
  // Parsed configuration does not evaluate media queries or native geometry.
});

test('parsed typography policy retains the system font token without global small-text/header overrides', () => {
  const { parsed, rows } = policy(); let font;
  parsed.walkDecls(declaration => {
    assert.equal(['--text-xs', '--text-sm'].includes(declaration.prop), false);
    if (declaration.prop === '--font-sans' && declaration.parent.type === 'atrule' && declaration.parent.name === 'theme') font = declaration.value.split(',').map(name => name.trim());
  });
  assert.deepEqual(font, ['system-ui', 'sans-serif']);
  for (const { rule, selectors } of rows) rule.walkDecls(declaration => {
    if (['height', 'min-height', 'max-height'].includes(declaration.prop)) assert.equal(selectors.some(selector => ['header', '.h-16'].includes(selector)), false);
  });
});

test('parsed focus and backdrop policies retain their scoped widths and colors', t => {
  const { declaration } = policy(); const dom = new JSDOM('<!doctype html><body></body>'); t.after(() => dom.window.close());
  const tokens = declaration('.settings-page :is(button, input, textarea, summary):focus-visible', 'outline').trim().split(/\s+(?![^()]*\))/);
  assert.ok(tokens.includes('solid')); assert.deepEqual(tokens.filter(token => Number.isFinite(Number.parseFloat(token))), ['2px']);
  const colors = tokens.filter(token => token !== 'solid' && !Number.isFinite(Number.parseFloat(token))); assert.equal(colors.length, 1);
  const probe = dom.window.document.createElement('span'); dom.window.document.body.append(probe);
  probe.style.color = colors[0]; assert.equal(dom.window.getComputedStyle(probe).color, 'rgb(18, 86, 166)');
  probe.style.color = declaration('.settings-assistance-dialog::backdrop', 'background');
  assert.equal(dom.window.getComputedStyle(probe).color, 'rgba(0, 0, 0, 0.4)');
  assert.equal(declaration('.settings-page :is(button, input, textarea, summary):focus-visible', 'outline-offset'), '2px');
  // Native focus visibility, backdrop rendering and modal isolation remain separate.
});
