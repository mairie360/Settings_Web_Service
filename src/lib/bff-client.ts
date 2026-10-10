import { navigateToLogin, isSessionRecoveryPending } from './logout';


// Chemins du contrat reconstruit depuis le paquet publié de BFF_Settings (npm run contracts:sync) : un appel hors
// contrat ne compile pas.
export type BffPath = keyof (typeof import('../../contracts/openapi.json'))['paths'];

function errorMessage(body: unknown, status: number): string {
  const payload = body as { error?: { message?: unknown }; message?: unknown } | null;
  for (const message of [payload?.error?.message, payload?.message]) {
    if (typeof message === 'string' && message.trim()) return message;
  }
  return status >= 500
    ? 'Le service est momentanément indisponible. Veuillez réessayer plus tard.'
    : 'La demande n’a pas pu aboutir. Veuillez réessayer.';
}

export async function requestBff<T>(path: BffPath, init: RequestInit = {}): Promise<T> {
  init.signal?.throwIfAborted();
  const headers = new Headers(init.headers);
  headers.delete('Authorization');
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch('/api/bff' + path, { ...init, headers, credentials: 'same-origin', cache: 'no-store', redirect: 'manual' });
  init.signal?.throwIfAborted();
  if (response.type === 'opaqueredirect') {
    navigateToLogin();
    throw new Error('Votre session nécessite une reconnexion au portail Mairie360.');
  }
  if (!response.ok) {
    if (response.status === 401 && !isSessionRecoveryPending()) navigateToLogin();
    const body = await response.json().catch(() => null);
    throw new Error(errorMessage(body, response.status));
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
