const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { JSDOM } = require('jsdom');

const root = resolve(__dirname, '..');
const markup = `<body class="mairie-ui"><div class="settings-shell"><main><section class="settings-page"><section class="settings-feature-card settings-account-card"><div class="settings-photo-controls"><div class="settings-file-selection"><label id="photo" class="settings-file-picker">Changer la photo<input type="file" accept="image/jpeg,image/png" class="sr-only" aria-describedby="settings-photo-help"></label></div></div><form><div class="settings-profile-fields"><label>Prénom<input value="Anne Marie"><span id="help" class="mt-1 block text-sm text-[#596274]">64 caractères maximum, sans &lt; ni &gt;.</span></label><label id="ordinary-label">Autre champ<input></label></div></form></section></section></main></div></body>`;

async function screen(theme) {
  const { compile } = await import('tailwindcss');
  const globals = readFileSync(resolve(root, 'src/app/globals.css'), 'utf8').replace(/^@import\s+"tailwindcss";$/m, '@tailwind utilities;');
  const municipal = readFileSync(require.resolve('@mairie360/lib-components/styles.css'), 'utf8');
  const dom = new JSDOM(`<html data-theme="${theme}"><head></head>${markup}</html>`);
  const classes = [...dom.window.document.querySelectorAll('[class]')].flatMap(element => [...element.classList]);
  const style = dom.window.document.createElement('style');
  style.textContent = municipal + "\n" + (await compile(globals)).build(classes);
  dom.window.document.head.append(style);
  const computed = element => dom.window.getComputedStyle(element);
  // JSDOM drops shorthand backgrounds containing var(), unlike browsers.
  // Resolve only the actual active colour tokens before applying its cascade.
  for (const [prefix, element] of [['mairie', dom.window.document.documentElement], ['settings', dom.window.document.querySelector('.settings-shell')]]) {
    const tokens = computed(element);
    style.textContent = style.textContent.replace(new RegExp(`var\\((--${prefix}-[\\w-]+)\\)`, 'g'), (match, name) => {
      const value = tokens.getPropertyValue(name).trim();
      return /^#[\da-f]{6}$/i.test(value) ? value : match;
    });
  }
  // Normalize colour-only background shorthands to equivalent longhands.
  // JSDOM otherwise lets a later, less-specific shorthand reset an earlier
  // background-color; Chromium's actual light/dark cascade is checked separately.
  const parsed = require('postcss').parse(style.textContent);
  parsed.walkDecls('background', declaration => {
    if (/^(?:#[\da-f]{3,8}|rgba?\([^)]*\)|var\(--[\w-]+\))$/i.test(declaration.value.trim())) {
      declaration.prop = 'background-color';
    }
  });
  style.textContent = parsed.toString();
  const variable = (element, name) => {
    for (let current = element; current; current = current.parentElement) {
      const value = computed(current).getPropertyValue(name).trim();
      if (value) return value;
    }
    return '';
  };
  const colour = (value, element) => {
    for (let pass = 0; pass < 10 && value.includes('var('); ++pass) value = value.replace(/var\((--[\w-]+)(?:,\s*([^)]*))?\)/g, (_match, name, fallback) => variable(element, name) || fallback || '');
    if (/^#[\da-f]{3}$/i.test(value)) value = '#' + [...value.slice(1)].map(char => char + char).join('');
    if (/^#[\da-f]{6}$/i.test(value)) return [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16));
    const rgb = /^rgb[a]?\((\d+)[, ]+(\d+)[, ]+(\d+)/.exec(value);
    assert.ok(rgb, `Expected an applied solid colour, received ${value}`);
    return rgb.slice(1, 4).map(Number);
  };
  const background = element => {
    for (let current = element; current; current = current.parentElement) {
      const value = computed(current).backgroundColor;
      if (value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') return colour(value, current);
    }
    throw new Error('No rendered background');
  };
  const luminance = channels => channels.map(channel => channel / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return {
    dom,
    colour: id => colour(computed(dom.window.document.getElementById(id)).color, dom.window.document.getElementById(id)),
    background: id => background(dom.window.document.getElementById(id)),
    contrast(id) {
      const element = dom.window.document.getElementById(id);
      const pair = [luminance(colour(computed(element).color, element)), luminance(background(element))].sort((a, b) => b - a);
      return (pair[0] + 0.05) / (pair[1] + 0.05);
    },
  };
}

for (const id of ['help', 'photo']) {
  test(`dark rendered Settings ${id} keeps AA contrast on its actual surface`, async context => {
    const view = await screen('dark');
    try {
      const ratio = view.contrast(id);
      context.diagnostic(`${id}: text rgb(${view.colour(id)}) on rgb(${view.background(id)}), contrast ${ratio.toFixed(2)}:1`);
      assert.ok(ratio >= 4.5, `${id} contrast ${ratio.toFixed(2)} must reach 4.5`);
    } finally { view.dom.window.close(); }
  });
}
test('the dark file-picker fix leaves ordinary labels transparent and the native file input intact', async () => {
  const view = await screen('dark');
  try {
    const document = view.dom.window.document;
    assert.equal(view.dom.window.getComputedStyle(document.getElementById('ordinary-label')).backgroundColor, 'rgba(0, 0, 0, 0)');
    assert.equal(document.querySelector('#photo input').type, 'file');
    assert.equal(document.querySelector('#photo input').disabled, false);
    assert.equal(document.querySelector('#photo input').className, 'sr-only');
  } finally { view.dom.window.close(); }
});
test('light Settings retains its existing helper text and photo-picker colours', async () => {
  const view = await screen('light');
  try {
    assert.deepEqual(view.colour('help'), [89, 98, 116]);
    assert.deepEqual(view.background('photo'), [248, 250, 252]);
    assert.deepEqual(view.colour('photo'), [18, 86, 166]);
  } finally { view.dom.window.close(); }
});
