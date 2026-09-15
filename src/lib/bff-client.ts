// Chemins du contrat reconstruit depuis le paquet publié de BFF_Settings (npm run contracts:sync) : un appel hors
// contrat ne compile pas.
export type BffPath = keyof (typeof import('../../contracts/openapi.json'))['paths'];

export async function requestBff<T>(path: BffPath, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(path, { ...init, headers, credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? body?.message ?? `Le service a répondu ${response.status}.`);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
