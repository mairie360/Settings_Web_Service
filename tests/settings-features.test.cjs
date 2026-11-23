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
  ['', 'nouveau-2026', 'nouveau-2026', 'Tous les champs de mot de passe sont obligatoires.'],
  ['ancien-2026', '', 'nouveau-2026', 'Tous les champs de mot de passe sont obligatoires.'],
  ['ancien-2026', 'nouveau-2026', '', 'Tous les champs de mot de passe sont obligatoires.'],
  // MAIR-876: Core's rule, 8 to 255 characters.
  ['ancien-2026', 'court', 'court', 'Le nouveau mot de passe doit contenir entre 8 et 255 caractères.'],
  ['ancien-2026', 'x'.repeat(256), 'x'.repeat(256), 'Le nouveau mot de passe doit contenir entre 8 et 255 caractères.'],
  ['ancien-2026', 'nouveau-2026', 'different-2026', 'Les nouveaux mots de passe ne correspondent pas.'],
  ['ancien-2026', 'ancien-2026', 'ancien-2026', 'Choisissez un mot de passe différent du mot de passe actuel.'],
  ['ancien-2026', 'nouveau-2026', 'nouveau-2026', ''],
]) test(`password validation distinguishes missing, length, mismatch, reuse and valid (${JSON.stringify([current, next.length > 20 ? `${next.length} chars` : next, confirmation.length > 20 ? `${confirmation.length} chars` : confirmation])})`, () => {
  assert.equal(validatePassword(current, next, confirmation), message);
});
