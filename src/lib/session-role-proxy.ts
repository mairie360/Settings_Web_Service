import { NextRequest } from 'next/server';
import { validSessionToken } from '@mairie360/lib-components/next';
import { normalizeDisplayRole } from '@mairie360/lib-components/shared';
import { validatedFrontHref } from './navigation';

const unavailable = (status: number) => Response.json({ message: 'Les informations du profil sont indisponibles.' }, {
  status, headers: { 'Cache-Control': 'no-store' },
});

/** Settings1.1 omits roles. Read the actual published User /me through Login's
 * existing API relay, using only shared cookies; never infer roles from a name. */
export async function sessionRole(request: NextRequest) {
  const front = validatedFrontHref(process.env.SETTINGS_FRONT_URL);
  const login = validatedFrontHref(process.env.LOGIN_FRONT_URL);
  if (!front || !login) return unavailable(503);
  const origin = new URL(front).origin;
  if (request.headers.get('sec-fetch-site') === 'cross-site' ||
    (request.headers.get('origin') && request.headers.get('origin') !== origin)) return unavailable(403);
  const target = new URL('/me', login);
  if (process.env.NODE_ENV === 'production' && target.protocol !== 'https:') return unavailable(503);
  const cookies = ['accessToken', 'refreshToken'].flatMap(name => {
    const value = request.cookies.get(name)?.value;
    return validSessionToken(value) ? [`${name}=${encodeURIComponent(value)}`] : [];
  });
  try {
    const response = await fetch(target, {
      // This authenticated server read has no browser Origin header. The
      // caller's browser origin was checked at this frontend boundary above.
      headers: { Accept: 'application/json', 'Sec-Fetch-Site': 'same-site', ...(cookies.length ? { Cookie: cookies.join('; ') } : {}) },
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(10_000),
    });
    if (response.status !== 200) return unavailable(response.status >= 400 && response.status < 600 ? response.status : 502);
    const body: unknown = await response.json();
    if (typeof body !== 'object' || body === null || !('user' in body) || typeof body.user !== 'object' || body.user === null) return unavailable(502);
    const user = body.user as { role?: unknown; roles?: unknown };
    const roles = typeof user.role === 'string' && user.role.trim() ? [user.role]
      : Array.isArray(user.roles) ? user.roles : 'roles' in body && Array.isArray(body.roles) ? body.roles : [];
    const isAdmin = roles.some(role => {
      const name = typeof role === 'string' ? role : typeof role === 'object' && role !== null && 'name' in role ? role.name : undefined;
      return normalizeDisplayRole(name) === 'Admin';
    });
    const headers = new Headers({ 'Cache-Control': 'no-store' });
    // Only the trusted Login owner may rotate the shared pair on this API read.
    for (const cookie of response.headers.getSetCookie()) headers.append('Set-Cookie', cookie);
    return Response.json({ isAdmin }, { headers });
  } catch { return unavailable(502); }
}
