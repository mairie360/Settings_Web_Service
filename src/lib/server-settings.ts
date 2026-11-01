import 'server-only';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { isExpiredJwt, publicOrigin } from '@mairie360/lib-components/shared';
import { createSettingsClient, type requestBff } from './bff-client';
import { configuredBffUrl, forwardToBff } from './bff-proxy';
import { selectSettingsBootstrap } from './settings-bootstrap';

/** One no-store SDK read through the existing contract-gated transport. */
export async function loadInitialSettings() {
  try {
    const origin = publicOrigin(process.env.SETTINGS_FRONT_URL);
    const baseUrl = configuredBffUrl();
    if (!origin || !baseUrl) return null;
    const access = (await cookies()).get('accessToken')?.value;
    if (isExpiredJwt(access)) return null;
    const transport: typeof requestBff = async <T>(path: string, init: RequestInit = {}) => {
      const target = new URL(path, origin);
      if (target.origin !== origin || (init.method ?? 'GET') !== 'GET') throw new Error('Read unavailable');
      const request = new NextRequest(target, { method: 'GET', cache: 'no-store',
        headers: { Accept: 'application/json', Cookie: `accessToken=${access}` } });
      // A document has no /api-scoped refresh cookie. A 401 is recovered later by
      // the same-origin browser transport, never by mutating cookies during render.
      const response = await forwardToBff(request, configuredBffUrl(), target.pathname);
      if (!response.ok) throw new Error('Read unavailable');
      return await response.json() as T;
    };
    const bffSettings = createSettingsClient(transport);
    const { data } = await bffSettings.getSettingsBootstrap();
    return selectSettingsBootstrap(data);
  } catch {
    return null;
  }
}
