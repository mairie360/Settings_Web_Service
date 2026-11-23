// MAIR-811: browser side of the passkey creation ceremony (src/lib/webauthn.ts).
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { requireSrc } = require('./support/load-ts.cjs');

const webauthn = requireSrc('lib/webauthn.ts');
const bytes = (...values) => new Uint8Array(values).buffer;

test('base64url and buffers convert both ways without padding', () => {
  assert.equal(webauthn.bufferToBase64Url(bytes(251, 255, 0, 1)), '-_8AAQ');
  assert.deepEqual([...new Uint8Array(webauthn.base64UrlToBuffer('-_8AAQ'))], [251, 255, 0, 1]);
});

test('creation options accept the whole CredentialCreationOptions or the bare publicKey', () => {
  const publicKey = { challenge: 'AQI', user: { id: 'AwQ', name: 'agent' }, excludeCredentials: [{ type: 'public-key', id: 'BQY' }], rp: { name: 'Mairie360' } };
  for (const options of [{ publicKey }, publicKey]) {
    const converted = webauthn.creationOptionsFromJson(options);
    assert.deepEqual([...new Uint8Array(converted.challenge)], [1, 2]);
    assert.deepEqual([...new Uint8Array(converted.user.id)], [3, 4]);
    assert.equal(converted.user.name, 'agent');
    assert.deepEqual([...new Uint8Array(converted.excludeCredentials[0].id)], [5, 6]);
    assert.equal(converted.rp.name, 'Mairie360');
  }
  assert.equal('excludeCredentials' in webauthn.creationOptionsFromJson({ challenge: 'AQI', user: { id: 'AwQ' } }), false);
});

test('the attestation is sent as WebAuthn JSON, transports included when the browser gives them', () => {
  const credential = {
    id: 'cred', rawId: bytes(1), type: 'public-key', authenticatorAttachment: 'platform',
    getClientExtensionResults: () => ({ credProps: { rk: true } }),
    response: { attestationObject: bytes(2), clientDataJSON: bytes(3), getTransports: () => ['internal'] },
  };
  assert.deepEqual(webauthn.attestationToJson(credential), {
    id: 'cred', rawId: 'AQ', type: 'public-key', authenticatorAttachment: 'platform', clientExtensionResults: { credProps: { rk: true } },
    response: { attestationObject: 'Ag', clientDataJSON: 'Aw', transports: ['internal'] },
  });
  const bare = webauthn.attestationToJson({ ...credential, authenticatorAttachment: null, response: { attestationObject: bytes(2), clientDataJSON: bytes(3) } });
  assert.equal('authenticatorAttachment' in bare, false);
  assert.equal('transports' in bare.response, false);
});

test('a closed browser window is a cancellation, any other error is not', () => {
  assert.equal(webauthn.isCancellation(new DOMException('closed', 'NotAllowedError')), true);
  assert.equal(webauthn.isCancellation(new DOMException('aborted', 'AbortError')), true);
  assert.equal(webauthn.isCancellation(new DOMException('bad', 'InvalidStateError')), false);
  assert.equal(webauthn.isCancellation(new Error('NotAllowedError')), false);
});

test('support needs PublicKeyCredential and navigator.credentials; the ceremony returns the JSON answer', async (t) => {
  const previousWindow = globalThis.window;
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator); else delete globalThis.navigator;
  });
  globalThis.window = {};
  assert.equal(webauthn.isWebAuthnSupported(), false);
  let received;
  const created = { id: 'cred', rawId: bytes(1), type: 'public-key', getClientExtensionResults: () => ({}), response: { attestationObject: bytes(2), clientDataJSON: bytes(3) } };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { credentials: { create: async (options) => { received = options; return created; } } } });
  globalThis.window = { PublicKeyCredential: function PublicKeyCredential() {} };
  assert.equal(webauthn.isWebAuthnSupported(), true);
  const answer = await webauthn.createPasskeyCredential({ publicKey: { challenge: 'AQI', user: { id: 'AwQ' } } });
  assert.deepEqual([...new Uint8Array(received.publicKey.challenge)], [1, 2]);
  assert.equal(answer.response.attestationObject, 'Ag');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { credentials: { create: async () => null } } });
  await assert.rejects(webauthn.createPasskeyCredential({ challenge: 'AQI', user: { id: 'AwQ' } }), /pas été créée/);
});
