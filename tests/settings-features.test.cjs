const assert = require('node:assert/strict');
const { test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');
const { changedFields, validatePassword } = requireSrc('lib/settings-features.ts');

test('changedFields preserves explicit resets and never sends unchanged fields', () => {
  const baseline = { theme: 'dark', enabled: true, label: 'A' };
  assert.deepEqual(changedFields(baseline, { theme: null, enabled: false, label: 'A' }), { theme: null, enabled: false });
  assert.deepEqual(changedFields(baseline, { ...baseline }), {});
  assert.deepEqual(baseline, { theme: 'dark', enabled: true, label: 'A' });
});

for (const [current, next, confirmation, message] of [
  ['', 'new', 'new', 'Tous les champs de mot de passe sont obligatoires.'],
  ['old', '', 'new', 'Tous les champs de mot de passe sont obligatoires.'],
  ['old', 'new', '', 'Tous les champs de mot de passe sont obligatoires.'],
  ['old', 'new', 'different', 'Les nouveaux mots de passe ne correspondent pas.'],
  ['old', 'old', 'old', 'Choisissez un mot de passe différent du mot de passe actuel.'],
  ['old', 'new', 'new', ''],
]) test(`password validation distinguishes missing, mismatch, reuse and valid (${JSON.stringify([current, next, confirmation])})`, () => {
  assert.equal(validatePassword(current, next, confirmation), message);
});
