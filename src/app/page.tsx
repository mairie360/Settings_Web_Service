import { createNonce } from '@mairie360/lib-components/shared';
import SettingsPage from '../components/SettingsPage';
import { loadInitialSettings } from '@/lib/server-settings';
import { keycloakAccountUrl } from '@/lib/keycloak-account';

export default async function Home() {
  const initialData = await loadInitialSettings();
  // Each document/RSC receipt owns a fresh client lifetime, without a session identifier.
  // Foreground reads remain inside that lifetime and preserve pending drafts.
  return <SettingsPage key={createNonce()} initialData={initialData} twoFactorUrl={keycloakAccountUrl()} />;
}
