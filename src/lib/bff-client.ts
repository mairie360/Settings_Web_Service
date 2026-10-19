import { sessionFetch } from '@mairie360/lib-components/browser';
import axios, { type AxiosAdapter } from 'axios';
import { getBffSettings } from '@mairie360/bff-settings-openapi/endpoints/bffSettings';
import { navigateToLogin, isSessionRecoveryPending } from './logout';


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

export async function requestBff<T>(path: string, init: RequestInit = {}): Promise<T> {
  init.signal?.throwIfAborted();
  const headers = new Headers(init.headers);
  headers.delete('Authorization');
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await sessionFetch(path, { ...init, headers, credentials: 'same-origin', cache: 'no-store', redirect: 'manual' });
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

// The generated operations of the published BFF_Settings contract own every path: axios only carries the
// request through requestBff, which keeps the same-origin cookie, redirect and 401 handling.
export function createSettingsClient(request: typeof requestBff = requestBff) {
  const contractAdapter: AxiosAdapter = async (config) => {
    const data = await request<unknown>(axios.getUri(config), {
      method: (config.method ?? 'get').toUpperCase(),
      headers: config.headers.toJSON() as Record<string, string>,
      body: typeof config.data === 'string' ? config.data : undefined,
      signal: (config.signal as AbortSignal | undefined) ?? undefined,
    });
    return {
      data,
      status: data === undefined ? 204 : 200,
      statusText: data === undefined ? 'No Content' : 'OK',
      headers: {},
      config,
    };
  };

  return getBffSettings(axios.create({ adapter: contractAdapter, headers: { Accept: 'application/json' } }));
}

export const bffSettings = createSettingsClient();
