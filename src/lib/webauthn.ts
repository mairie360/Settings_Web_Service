/**
 * Browser side of the passkey creation ceremony (MAIR-811): BFF_Settings speaks WebAuthn JSON (base64url binaries),
 * `navigator.credentials` speaks buffers. Same conversions as the Login front's `PasskeySignIn/webauthn.ts`.
 */

export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential === "function" && typeof navigator !== "undefined" && !!navigator.credentials;
}

export function base64UrlToBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

export function bufferToBase64Url(buffer: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

type JsonObject = Record<string, unknown>;
type CredentialDescriptorJson = JsonObject & { id?: unknown };

/** The `options` of BFF_Settings are either the whole `CredentialCreationOptions` (`{ publicKey }`) or the bare `publicKey`. */
export function creationOptionsFromJson(options: JsonObject): PublicKeyCredentialCreationOptions {
  const source = (typeof options.publicKey === "object" && options.publicKey !== null ? options.publicKey : options) as JsonObject;
  const user = source.user as JsonObject;
  const excludeCredentials = Array.isArray(source.excludeCredentials)
    ? (source.excludeCredentials as CredentialDescriptorJson[]).map((descriptor) => ({ ...descriptor, id: base64UrlToBuffer(String(descriptor.id)) }))
    : undefined;
  return {
    ...source,
    challenge: base64UrlToBuffer(String(source.challenge)),
    user: { ...user, id: base64UrlToBuffer(String(user.id)) },
    ...(excludeCredentials ? { excludeCredentials } : {}),
  } as PublicKeyCredentialCreationOptions;
}

/** The new `PublicKeyCredential` as its WebAuthn JSON form, which BFF_Settings forwards to Core as is. */
export function attestationToJson(credential: PublicKeyCredential): JsonObject {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    ...(credential.authenticatorAttachment ? { authenticatorAttachment: credential.authenticatorAttachment } : {}),
    clientExtensionResults: credential.getClientExtensionResults(),
    response: {
      attestationObject: bufferToBase64Url(response.attestationObject),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      ...(typeof response.getTransports === "function" ? { transports: response.getTransports() } : {}),
    },
  };
}

/** The browser window was closed or the ceremony was replaced: nothing to tell the agent. */
export function isCancellation(error: unknown): boolean {
  return typeof DOMException !== "undefined" && error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "AbortError");
}

/** Runs the browser ceremony for creation options received from BFF_Settings and returns the answer to register. */
export async function createPasskeyCredential(options: JsonObject): Promise<JsonObject> {
  const credential = await navigator.credentials.create({ publicKey: creationOptionsFromJson(options) });
  if (!credential) throw new Error("La passkey n’a pas été créée.");
  return attestationToJson(credential as PublicKeyCredential);
}
