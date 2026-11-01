import { navigateToLogin } from './logout';

/** Administration navigation is based on Login's authoritative User read. */
export async function loadSessionRole(signal: AbortSignal): Promise<boolean> {
  const response = await fetch('/api/auth/role', {
    credentials: 'same-origin', cache: 'no-store', redirect: 'manual', signal,
  });
  signal.throwIfAborted();
  if (response.type === 'opaqueredirect' || response.status === 401) {
    navigateToLogin();
    return false;
  }
  if (!response.ok) return false;
  const body: unknown = await response.json();
  signal.throwIfAborted();
  return typeof body === 'object' && body !== null && 'isAdmin' in body && body.isAdmin === true;
}
