const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { requireSrc } = require('./support/load-ts.cjs');
const Information = requireSrc('components/settings-browser-information.tsx').default;

test('browser information has stable server markup without accessing browser or account state', (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let reads = 0;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, get() { reads++; throw Error('No browser on server'); } });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'navigator', previous);
    else delete globalThis.navigator;
  });
  const first = renderToStaticMarkup(React.createElement(Information));
  assert.equal(renderToStaticMarkup(React.createElement(Information)), first);
  assert.equal(reads, 0);
  assert.match(first, /aria-labelledby="settings-browser-information-title"/);
  assert.equal((first.match(/Identification après chargement/g) || []).length, 2);
  assert.match(first, /Familles estimées localement/);
  assert.doesNotMatch(first, /Chrome|Firefox|Linux|private|cookie|session|v2\.1\.0/);
});
