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

export type BffErrorDetail = { path?: string; message: string };

/**
 * Refusal of BFF_Settings: `message` is the BFF `error.message` (French fallback otherwise), with the HTTP status
 * and the `error.code` / `error.details[]` of the shared ErrorResponse envelope, so a form can point at the
 * refused fields (MAIR-511).
 */
export class BffRequestError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: readonly BffErrorDetail[];

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'BffRequestError';
    this.status = status;
    const error = (body as { error?: { code?: unknown; details?: unknown } } | null)?.error;
    this.code = typeof error?.code === 'string' ? error.code : undefined;
    this.details = Array.isArray(error?.details)
      ? error.details.flatMap((detail: unknown) => {
        const item = detail as { path?: unknown; message?: unknown } | null;
        return typeof item?.message === 'string'
          ? [{ path: typeof item.path === 'string' ? item.path : undefined, message: item.message }]
          : [];
      })
      : [];
  }
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
    throw new BffRequestError(errorMessage(body, response.status), response.status, body);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
