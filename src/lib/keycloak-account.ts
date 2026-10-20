/**
 * Keycloak account console of the instance realm (MAIR-357): agents add, replace or remove their second
 * factor there (MAIR-572). Read on the server from KEYCLOAK_REALM_URL, the public realm URL Login uses too
 * (`https://<host>/realms/<realm>`); undefined when the instance has no Keycloak or the value is not a realm
 * URL. HTTPS only: plain HTTP is accepted for a loopback host (local development) and nowhere else.
 */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const REALM_PATH = /^(?:\/[^/]+)*\/realms\/[^/]+\/?$/;

export function keycloakAccountUrl(value = process.env.KEYCLOAK_REALM_URL): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const realm = new URL(value.trim());
    const secure = realm.protocol === 'https:' || (realm.protocol === 'http:' && LOOPBACK_HOSTS.has(realm.hostname));
    if (!secure || realm.username || realm.password || realm.search || realm.hash || !REALM_PATH.test(realm.pathname)) return undefined;
    // Built from origin and path: an empty `?` or `#` left at the end of the value is dropped.
    return `${realm.origin}${realm.pathname.replace(/\/+$/, '')}/account`;
  } catch {
    return undefined;
  }
}
