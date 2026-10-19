import { createNonce } from '@mairie360/front-kit/shared';
import SettingsPage from '@/components/settings-page';
import { loadInitialSettings } from '@/lib/server-settings';

export default async function Home() {
  const initialData = await loadInitialSettings();
  // Each document/RSC receipt owns a fresh client lifetime, without a session identifier.
  // Foreground reads remain inside that lifetime and preserve pending drafts.
  return <SettingsPage key={createNonce()} initialData={initialData} />;
}
