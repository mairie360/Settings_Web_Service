const assert = require('node:assert/strict');
const { test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');

const { formatSessionDate } = requireSrc('lib/session-date.ts');

test('formats valid BFF session timestamps for French users', () => {
  const value = '2026-09-15T08:00:00Z';
  const expected = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date(value));
  assert.equal(formatSessionDate(value), expected);
  assert.notEqual(formatSessionDate(value), value);
  assert.ok(formatSessionDate('2028-02-29T10:30:00+04:00'));
});

test('rejects missing, malformed and impossible dates instead of inventing a value', () => {
  for (const value of [undefined, null, '', 'not-a-date', '2026-02-30T08:00:00Z',
    '2026-09-15T25:00:00Z', '2026-09-15T08:00:00']) {
    assert.equal(formatSessionDate(value), null, String(value));
  }
});
