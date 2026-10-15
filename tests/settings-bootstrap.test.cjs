const assert = require('node:assert/strict');
const { test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');
const { isConfirmedBootstrap, isConfirmedProfile, selectSettingsBootstrap } = requireSrc('lib/settings-bootstrap.ts');
const fixture = require('./support/settings-fixtures.cjs');

test('profile and session validation retain nullable fields and reject incoherent identities', () => {
  for (const profile of [null, [], {}, fixture.profile({email:42}), fixture.profile({phone:false})]) assert.equal(isConfirmedProfile(profile),false);
  for (const profile of [fixture.profile(), fixture.profile({phone:null}), {first_name:'',last_name:'',email:''}]) assert.equal(isConfirmedProfile(profile),true);
  for (const value of [null, [], {}, fixture.bootstrap({profile:null}), fixture.bootstrap({sessions:{}}), fixture.bootstrap({sources:null}), fixture.bootstrap({sources:[]}), fixture.bootstrap({sources:{sessions:'pending'}}), fixture.bootstrap({sessions:[null]}), fixture.bootstrap({sessions:[[]]}), fixture.bootstrap({sessions:[fixture.session('s',{id:1})]}), fixture.bootstrap({sessions:[fixture.session('s',{revoked_at:1})]})]) assert.equal(isConfirmedBootstrap(value),false);
  assert.equal(isConfirmedBootstrap(fixture.bootstrap({sessions:[fixture.session('s',{revoked_at:undefined})]})),true);
});

test('the server projection excludes unknown fields while preserving null, absence and published values', () => {
  const original=fixture.bootstrap({profile:fixture.profile({phone_country:'FR'}), appearance:{theme:null},general:null,notifications:undefined});
  original.profile.secret='never-serialize';original.sessions[0].secret='never-serialize';original.appearance.secret='never-serialize';original.sources.secret='never-serialize';original.secret='never-serialize';
  const selected=selectSettingsBootstrap(original);
  assert.ok(selected);assert.equal(selected.profile.phone_country,'FR');assert.deepEqual(selected.appearance,{theme:null});assert.equal(selected.general,null);assert.equal(selected.notifications,undefined);
  assert.doesNotMatch(JSON.stringify(selected),/never-serialize/);
  delete original.notifications;assert.equal('notifications' in selectSettingsBootstrap(original),false);
  assert.deepEqual(selectSettingsBootstrap(fixture.bootstrap()),fixture.bootstrap());
});

for (const [name,patch] of [
  ['an invalid optional source',{sources:{sessions:'available',preferences:{secret:'never-serialize'}}}],
  ['an invalid optional notification source',{sources:{sessions:'available',notifications:42}}],
  ['an invalid profile country',{profile:fixture.profile({phone_country:42})}],
  ['an array appearance',{appearance:[]}], ['a primitive general group',{general:false}],
  ['a nonboolean notification',{notifications:{email:'true'}}], ['a nonboolean general option',{general:{auto_open_notifications:'true'}}],
  ['a fractional font size',{appearance:{font_size:16.5}}], ['an out-of-range font size',{appearance:{font_size:32768}}],
  ['a nonstring font',{appearance:{font_family:{secret:'never-serialize'}}}], ['an unknown theme',{appearance:{theme:'unverified'}}],
]) test(`the server projection refuses ${name} instead of serializing an unconfirmed value`,()=>assert.equal(selectSettingsBootstrap(fixture.bootstrap(patch)),null));

test('malformed core data cannot become a serialized initial receipt',()=>assert.equal(selectSettingsBootstrap({profile:{}}),null));
