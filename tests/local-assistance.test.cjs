const assert = require('node:assert/strict');
const { test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');
const { assistanceFile, deviceFamilies, diagnosticFile, downloadLocalFile } = requireSrc('lib/local-assistance.ts');
const date = new Date('2026-09-26T09:00:00Z');

test('support and report exports contain only explicit authored content and metadata', () => {
  for (const [kind, name, title] of [['support', 'demande-support-settings.txt', 'Demande de support'], ['report', 'signalement-settings.txt', 'Signalement']]) {
    const file = assistanceFile(kind, '<script>literal</script>\nUne question éè', date);
    assert.equal(file.name, name);
    assert.equal(file.type, 'text/plain;charset=utf-8');
    assert.equal(file.content, `${title} — Settings\n2026-09-26T09:00:00.000Z\n\n<script>literal</script>\nUne question éè\n\nFichier préparé localement. Aucun message n’a été envoyé.\n`);
  }
});

test('exports reject blank and oversized messages, accepting exactly 5000 characters', () => {
  for (const message of ['', ' \n\t ', 'a'.repeat(5001)]) assert.throws(() => assistanceFile('support', message), /1 à 5 000/);
  assert.ok(assistanceFile('support', 'a'.repeat(5000)).content.includes('a'.repeat(5000)));
});

const agents = [
  ['Windows NT Chrome/120 Safari/537 Edg/120', 'Edge', 'Windows'],
  ['Linux Android Chrome/120 Safari/537 OPR/100', 'Opera', 'Android'],
  ['iPhone Mac OS X FxiOS/120 Safari/605', 'Firefox', 'iOS'],
  ['iPad CriOS/120 Safari/605', 'Chrome', 'iOS'],
  ['Macintosh Version/17 Safari/605', 'Safari', 'macOS'],
  ['Linux Firefox/120', 'Firefox', 'Linux'],
  ['CrOS Linux Chrome/120 Safari/537', 'Chrome', 'ChromeOS'],
  ['unrecognized sensitive-token', 'Non identifié', 'Non identifié'],
];
for (const [agent, browser, operatingSystem] of agents) {
  test(`diagnostic detects coarse ${browser}/${operatingSystem} without exporting raw input`, () => {
    assert.deepEqual(deviceFamilies(agent), { browser, operatingSystem });
    const file = diagnosticFile(agent, true, date);
    assert.deepEqual(JSON.parse(file.content), { module: 'Settings_Web_Service', generatedAt: date.toISOString(), browser, operatingSystem, capabilities: { objectUrls: true } });
    assert.equal(file.name, 'diagnostic-local-settings.json');
    assert.equal(file.type, 'application/json;charset=utf-8');
    assert.ok(!file.content.includes(agent));
  });
}

test('diagnostic handles unavailable APIs and unknown devices without inventing values', () => {
  const value = JSON.parse(diagnosticFile('', false).content);
  assert.equal(value.capabilities.objectUrls, false);
  assert.equal(value.browser, 'Non identifié');
  assert.ok(Number.isFinite(Date.parse(value.generatedAt)));
});

function downloadHarness(t, fail) {
  const calls = []; let cleanup; let blob;
  const anchor = { remove() { calls.push('remove'); }, click() { calls.push('click'); if (fail === 'click') throw new Error('download blocked'); } };
  t.mock.method(URL, 'createObjectURL', (value) => { blob = value; return 'blob:local-test'; });
  t.mock.method(URL, 'revokeObjectURL', (url) => calls.push(['revoke', url]));
  t.mock.method(globalThis, 'setTimeout', (fn, delay) => { calls.push(['timer', delay]); cleanup = fn; });
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    createElement(tag) { assert.equal(tag, 'a'); if (fail === 'create') throw new Error('no document'); return anchor; },
    body: { appendChild(value) { assert.equal(value, anchor); calls.push('append'); if (fail === 'append') throw new Error('no document'); } },
  } });
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'document', previous); else delete globalThis.document; });
  return { calls, anchor, cleanup: () => cleanup(), blob: () => blob };
}

test('download uses a temporary Blob and cleans up the link and object URL', async (t) => {
  const h = downloadHarness(t);
  downloadLocalFile({ name: 'request.txt', type: 'text/plain;charset=utf-8', content: 'Only authored text' });
  assert.equal(h.anchor.download, 'request.txt'); assert.equal(h.anchor.href, 'blob:local-test'); assert.equal(h.anchor.hidden, true);
  assert.equal(await h.blob().text(), 'Only authored text');
  assert.equal(h.blob().type, 'text/plain;charset=utf-8');
  assert.deepEqual(h.calls, ['append', 'click', 'remove', ['timer', 1000]]);
  h.cleanup(); assert.deepEqual(h.calls.at(-1), ['revoke', 'blob:local-test']);
});

for (const stage of ['append', 'click']) test(`download failure during ${stage} immediately releases its URL`, (t) => {
  const h = downloadHarness(t, stage);
  assert.throws(() => downloadLocalFile(assistanceFile('support', 'A question', date)));
  assert.deepEqual(h.calls.slice(-2), ['remove', ['revoke', 'blob:local-test']]);
  assert.ok(!h.calls.some((call) => Array.isArray(call) && call[0] === 'timer'));
});

test('unavailable Blob download fails without touching application storage', (t) => {
  t.mock.method(URL, 'createObjectURL', () => { throw new Error('not supported'); });
  assert.throws(() => downloadLocalFile(assistanceFile('report', 'A question')), /not supported/);
});

test('an unavailable document also releases the allocated object URL', (t) => {
  const h = downloadHarness(t, 'create');
  assert.throws(() => downloadLocalFile(assistanceFile('report', 'A question')));
  assert.deepEqual(h.calls, [['revoke', 'blob:local-test']]);
});
