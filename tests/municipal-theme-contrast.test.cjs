const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { JSDOM } = require('jsdom');
const css = readFileSync(require.resolve('@mairie360/lib-components/styles.css'), 'utf8');
function screen(theme) {
  const dom = new JSDOM(`<html data-theme="${theme}"><head><style>${css}</style></head><body class="mairie-ui"><main><input class="bg-white" value="Texte"><select class="bg-white"><option>Choix</option></select><textarea class="bg-white">Texte</textarea><article class="mairie-task-card">Dossier communal</article><button type="button">Action</button></main></body></html>`);
  const root = dom.window.getComputedStyle(dom.window.document.documentElement);
  // JSDOM keeps var() for backgrounds but drops unresolved border colours.
  // Substitute the active root colour tokens before asking its CSS cascade.
  dom.window.document.querySelector('style').textContent = css.replace(/var\((--mairie-[\w-]+)\)/g, (match, name) => {
    const value = root.getPropertyValue(name).trim();
    return /^#[\da-f]{6}$/i.test(value) ? value : match;
  });
  const colour = value => {
    const resolved = value.replace(/var\((--[\w-]+)(?:,\s*([^)]*))?\)/g, (_match, name, fallback) => root.getPropertyValue(name).trim() || fallback || '');
    if (/^#[\da-f]{6}$/i.test(resolved)) return [1, 3, 5].map(index => parseInt(resolved.slice(index, index + 2), 16));
    const rgb = /^rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/.exec(resolved);
    assert.ok(rgb, `A solid colour must be available for ${value}, received ${resolved}`);
    return rgb.slice(1, 4).map(Number);
  };
  const luminance = value => colour(value).map(channel => channel / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const contrast = (a, b) => { const values = [luminance(a), luminance(b)].sort((a, b) => b - a); return (values[0] + 0.05) / (values[1] + 0.05); };
  return { dom, root, contrast };
}
for (const theme of ['light', 'dark']) test(`${theme}: input, select and textarea remain readable on their actual control backgrounds`, () => {
  const { dom, contrast } = screen(theme);
  for (const element of dom.window.document.querySelectorAll('input,select,textarea')) {
    const style = dom.window.getComputedStyle(element);
    assert.ok(contrast(style.color, style.backgroundColor) >= 4.5, `${element.tagName}: text contrast`);
    assert.ok(contrast(style.borderTopColor, style.backgroundColor) >= 3, `${element.tagName}: control border contrast`);
    element.focus();
    assert.ok(dom.window.document.activeElement === element, 'controls retain native keyboard focus');
  }
  dom.window.close();
});
test('the dark municipal semantic palette has readable surfaces, focus indicators and feedback', () => {
  const { dom, root, contrast } = screen('dark');
  for (const [foreground, background, minimum] of [
    ['--mairie-text', '--mairie-surface', 7], ['--mairie-muted', '--mairie-surface', 4.5],
    ['--mairie-accent', '--mairie-control-background', 4.5], ['--mairie-control-border', '--mairie-control-background', 3],
    ['--mairie-error-text', '--mairie-error-surface', 4.5], ['--mairie-success-text', '--mairie-success-surface', 4.5],
  ]) assert.ok(contrast(root.getPropertyValue(foreground).trim(), root.getPropertyValue(background).trim()) >= minimum, `${foreground} on ${background}`);
  const card = dom.window.getComputedStyle(dom.window.document.querySelector('article'));
  assert.ok(contrast(card.color, card.backgroundColor) >= 7);
  dom.window.close();
});

test('reduced motion disables municipal transitions and animated scrolling', () => {
  const { dom } = screen('dark');
  const media = [...dom.window.document.styleSheets[0].cssRules].find(rule => rule.conditionText?.includes('prefers-reduced-motion: reduce') && [...rule.cssRules].some(child => child.style?.getPropertyValue('scroll-behavior') === 'auto'));
  assert.ok(media, 'reduced motion has a matching style block');
  const styles = [...media.cssRules].find(rule => rule.style?.getPropertyValue('scroll-behavior') === 'auto').style;
  assert.ok(parseFloat(styles.getPropertyValue('animation-duration')) <= 0.01);
  assert.ok(parseFloat(styles.getPropertyValue('transition-duration')) <= 0.01);
  assert.equal(styles.getPropertyValue('scroll-behavior').replace(/\s*!important$/, ''), 'auto');
  dom.window.close();
});
