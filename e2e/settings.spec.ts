import { expect, test } from '@playwright/test';
import { cookieHeader, mintAccessToken, signInAs, users } from './support/session';

// Critical journeys of the Settings front (MAIR-603), on the real stack of docker-compose-e2e.yml
// (BFF Settings, Core API, seeded database): an agent edits their profile and finds it saved after
// a reload; an e-mail change with a wrong current password and a forged session are refused and
// change nothing. The texts asserted are the French ones displayed on screen.

const phone = `+33 1 ${String(Date.now()).slice(-8).replace(/(\d{2})(?=\d)/g, '$1 ')}`;

test.describe('agent editing their profile', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL!, users.manager);
    await page.goto('/');
    await expect(page.getByRole('tab', { name: 'Profil' })).toBeVisible();
    await expect(page.getByLabel('Prénom')).toHaveValue('Perf');
  });

  test('saves a new phone number that survives a reload', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Enregistrer le profil' })).toBeDisabled();
    await page.getByLabel('Téléphone').fill(phone);
    await page.getByRole('button', { name: 'Enregistrer le profil' }).click();
    await expect(page.getByText('Votre profil a été enregistré.')).toBeVisible();

    await page.reload();
    // Stored without its spaces.
    await expect(page.getByLabel('Téléphone')).toHaveValue(phone.replace(/\s/g, ''));
  });

  test('an e-mail change with a wrong current password is refused', async ({ page }) => {
    await page.getByLabel('E-mail').fill('perf-tester-renomme@mairie360.fr');
    // The current password is only asked for an e-mail change.
    await page.getByLabel('Mot de passe actuel').fill('pas-le-bon-mot-de-passe');
    await page.getByRole('button', { name: 'Enregistrer le profil' }).click();
    // BFF Settings answers 403: the front names the cause.
    await expect(page.getByText('Le mot de passe actuel est incorrect, ou ce compte n’a pas de mot de passe.')).toBeVisible();
    await expect(page.getByText('Votre profil a été enregistré.')).toHaveCount(0);

    await page.reload();
    await expect(page.getByLabel('E-mail')).toHaveValue('perf-tester@mairie360.fr');
  });
});

test('a forged session cannot change a profile', async ({ request }) => {
  const [header, payload] = mintAccessToken(users.member).split('.');
  const forged = await request.patch('/settings/profile', {
    headers: { Cookie: `accessToken=${header}.${payload}.c2lnbmF0dXJlLWZvcmdlZQ`, Accept: 'application/json' },
    data: { first_name: 'Pirate' },
    maxRedirects: 0,
  });
  expect(forged.status()).toBe(401);
  // The genuine session of the same agent still reads their own, unchanged profile.
  const bootstrap = await request.get('/settings/bootstrap', {
    headers: { Cookie: cookieHeader(users.member), Accept: 'application/json' },
    maxRedirects: 0,
  });
  expect(bootstrap.status()).toBe(200);
  expect(JSON.stringify(await bootstrap.json())).toContain('Membre');
});

test('without a session, the settings are not served', async ({ request }) => {
  const response = await request.get('/', { maxRedirects: 0 });
  expect(response.status()).toBe(307);
});
