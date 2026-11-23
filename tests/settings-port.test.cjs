// MAIR-876: the password change port (src/lib/settings-port.ts) explains every refusal in French.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');

const { passwordFailure } = requireSrc('lib/settings-port.ts');
const { BffRequestError } = requireSrc('lib/bff-client.ts');

for (const [status, message] of [
  [403, 'Le mot de passe actuel est incorrect, ou ce compte n’a pas de mot de passe.'],
  [429, 'Trop de tentatives. Réessayez dans quelques minutes.'],
  [400, 'Le nouveau mot de passe doit contenir entre 8 et 255 caractères et être différent de l’actuel.'],
  [502, 'Le mot de passe n’a pas été modifié. Réessayez.'],
]) test(`a ${status} on the password change reads « ${message} »`, () => {
  assert.equal(passwordFailure(new BffRequestError('upstream text', status, null)), message);
});

test('a network failure never shows its technical message', () => {
  assert.equal(passwordFailure(new TypeError('fetch failed')), 'Le mot de passe n’a pas été modifié. Réessayez.');
});
