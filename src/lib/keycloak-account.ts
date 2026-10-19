/**
 * Keycloak account console of the instance realm (MAIR-357): agents add, replace or remove their second
 * factor there (MAIR-572). Read on the server from KEYCLOAK_REALM_URL, the public realm URL Login uses too;
 * undefined when the instance has no Keycloak.
 */
export function keycloakAccountUrl(value = process.env.KEYCLOAK_REALM_URL): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const realm = new URL(value.trim());
    if (!['http:', 'https:'].includes(realm.protocol) || realm.username || realm.password || realm.search || realm.hash) return undefined;
    return `${realm.href.replace(/\/+$/, '')}/account`;
  } catch {
    return undefined;
  }
}
