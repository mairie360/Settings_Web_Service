const assert = require('node:assert/strict');
const { test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');
const { isEmailChanged, profilePatch, saveErrorMessage, describeDetail } = requireSrc('lib/profile-form.ts');
const { BffRequestError } = requireSrc('lib/bff-client.ts');
const { profile } = require('./support/settings-fixtures.cjs');

test('email confirmation ignores whitespace and case while the profile patch preserves the explicit input', () => {
  const confirmed = profile({ email: 'Anne@mairie.test' });
  const current = { ...confirmed, email: '  ANNE@MAIRIE.TEST  ' };
  assert.equal(isEmailChanged(confirmed, current), false);
  assert.deepEqual(profilePatch(confirmed, current), { email: '  ANNE@MAIRIE.TEST  ' });
  assert.equal(isEmailChanged(confirmed, { ...current, email: 'other@mairie.test' }), true);
});

test('profile patches contain changed editable fields only, including clearing an optional phone', () => {
  const confirmed = profile();
  assert.deepEqual(profilePatch(confirmed, confirmed), {});
  assert.deepEqual(profilePatch(confirmed, { ...confirmed, first_name: 'Anne', last_name: 'Autre', phone: undefined, current_password: 'excluded', id: 55 }), { first_name: 'Anne', last_name: 'Autre', phone: null });
  assert.deepEqual(profilePatch(profile({ phone: undefined }), profile({ phone: undefined })), {});
});

for (const [status, withPassword, message] of [
  [403, true, 'Le mot de passe actuel est incorrect, ou ce compte n’a pas de mot de passe.'],
  [403, false, 'Refused'],
  [409, false, 'Cette adresse e-mail est déjà utilisée par un autre compte.'],
  [502, false, 'Refused'],
]) test(`save errors retain or specialize the server refusal (${status}, password ${withPassword})`, () => {
  assert.deepEqual(saveErrorMessage(new BffRequestError('Refused', status, {}), withPassword), { message, details: [] });
});

test('save errors expose translated validation details and safely handle non-Error failures', () => {
  const error = new BffRequestError('Bad request', 400, { error: { details: [{ path: 'body.email', message: 'Invalid email address' }, { path: 'body.current_password', message: 'Required when email is changed' }] } });
  assert.deepEqual(saveErrorMessage(error, true), { message: 'Le profil n’a pas pu être enregistré : vérifiez les champs signalés.', details: ['E-mail : adresse e-mail invalide', 'Mot de passe actuel : requis pour changer l’adresse e-mail'] });
  assert.deepEqual(saveErrorMessage(new Error('Network refused'), false), { message: 'Network refused', details: [] });
  assert.deepEqual(saveErrorMessage(null, false), { message: 'Le profil n’a pas pu être enregistré.', details: [] });
});

for (const [path, message, expected] of [
  ['body.first_name', 'Must not contain < or >', 'Prénom : ne doit pas contenir < ni >'],
  ['body.phone', 'Expected a phone number with punctuation', 'Téléphone : chiffres, espaces, points, tirets, parenthèses et un + initial seulement'],
  ['body.phone_country', 'Expected an ISO 3166-1 alpha-2 code', 'Pays du téléphone : code pays à deux lettres attendu'],
  ['body.last_name', 'Required', 'Nom : requis'],
  ['body.custom', 'Unrecognized key in object', 'custom : champ non pris en charge'],
  ['body.first_name', 'String must contain at least 1 character', 'Prénom : ne doit pas être vide'],
  ['body.last_name', 'String must contain at least 2 characters', 'Nom : 2 caractères minimum'],
  ['body.last_name', 'String must contain at most 64 characters', 'Nom : 64 caractères maximum'],
  ['body.last_name', 'String <=64 characters', 'Nom : 64 caractères maximum'],
  [undefined, 'Untranslated server message', 'Untranslated server message'],
  ['body', 'Required', 'requis'],
]) test(`validation details identify the field and translate ${message}`, () => {
  assert.equal(describeDetail({ path, message }), expected);
});

test('MAIR-1231 the job title and the biography are sent trimmed, and a blank one is sent as null', () => {
  const confirmed = profile({ job_title: 'Agent', biography: null });
  assert.deepEqual(profilePatch(confirmed, { ...confirmed, job_title: '  Chef de service  ', biography: ' Voirie.\nAstreinte le lundi. ' }),
    { job_title: 'Chef de service', biography: 'Voirie.\nAstreinte le lundi.' });
  assert.deepEqual(profilePatch(confirmed, { ...confirmed, job_title: '   ' }), { job_title: null });
  assert.deepEqual(profilePatch(confirmed, { ...confirmed, service: { id: 3, name: 'Voirie' }, has_photo: true }), {}, 'the service and the photo flag are never sent');
});

test('MAIR-1231 the local checks refuse a job title over one line or 100 characters and a biography over 1000', () => {
  const { validateProfile, FIELD_MESSAGES } = requireSrc('lib/profile-form.ts');
  const valid = profile();
  assert.deepEqual(validateProfile({ ...valid, job_title: 'a'.repeat(100), biography: 'b'.repeat(1000) }), {});
  assert.deepEqual(validateProfile({ ...valid, job_title: 'a'.repeat(101), biography: 'b'.repeat(1001) }),
    { job_title: FIELD_MESSAGES.job_title, biography: FIELD_MESSAGES.biography });
  assert.deepEqual(validateProfile({ ...valid, job_title: 'Chef\nde service' }), { job_title: FIELD_MESSAGES.job_title });
});
