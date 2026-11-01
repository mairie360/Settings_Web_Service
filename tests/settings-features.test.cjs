const assert = require('node:assert/strict');
const { test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');
const { changedFields, validatePassword, validatePhoto } = requireSrc('lib/settings-features.ts');

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

for (const [name, type, size, message] of [
  ['unaccepted MIME', 'image/svg+xml', 100, 'Utilisez une photo JPG ou PNG.'],
  ['empty file', 'image/jpeg', 0, 'La photo doit contenir entre 1 octet et 2 Mo.'],
  ['oversized file', 'image/png', 2097153, 'La photo doit contenir entre 1 octet et 2 Mo.'],
  ['minimum size JPEG', 'image/jpeg', 1, ''],
  ['maximum size PNG', 'image/png', 2097152, ''],
]) test(`photo validation accepts only bounded raster uploads: ${name}`, () => {
  assert.equal(validatePhoto(new File([new Uint8Array(size)], 'photo', { type })), message);
});
