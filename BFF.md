# Contrat web service / BFF

Ce web service consomme **BFF_Settings**. Le contrat est celui publié dans le paquet `@mairie360/bff-settings-openapi`, épinglé à une version exacte dans `package.json` ; [contracts/openapi.json](contracts/openapi.json) en est la reconstruction versionnée et les types TypeScript sont importés depuis le paquet.

## Routes implémentées

Les chemins métier sont relatifs au BFF. Les proxies web conservent méthode, paramètres, contenu binaire, statuts et cookies. Ce front n’appelle aucun autre BFF : il n’expose pas d’adaptateur de session vers BFF User, la session provient uniquement du cookie `accessToken`. Le menu de compte redirige vers `/logout` sur le front Login configuré ; Settings n’a ni route locale de déconnexion ni appel direct à BFF User. Les pages Next.js sont distinctes des routes de données.

| Méthode | Route | Réponse / schéma |
| --- | --- | --- |
| GET | `/health` | 200 OK |
| GET | `/check_apis` | 200 Services disponibles |
| GET | `/settings/bootstrap` | 200 SettingsBootstrap |
| PATCH | `/settings/profile` | 200 SettingsProfile (corps SettingsProfilePatch : `current_password` requis par le BFF quand l’e-mail change) |
| PATCH | `/settings/notifications` | 200 SettingsNotifications |
| PATCH | `/settings/appearance` | 200 SettingsAppearance |
| PATCH | `/settings/general` | 200 SettingsGeneral |

## Mise à jour et validation

Le paquet est épinglé à une version exacte : une release `X.Y.Z` de BFF_Settings, ou, tant qu’aucune release n’est coupée, le paquet `0.0.0-dev.<sha>` publié par la CICD pour le commit courant de son `main` (MAIR-509 ; jamais une pré-version `staging`). Après une nouvelle version, exécuter `npm install --save-exact @mairie360/bff-settings-openapi@<version>`, puis `npm run contracts:sync`, `npm run contracts:check` et `npm run test:contracts`. Le tag de l’image `bff-settings` des `docker-compose*.yml` doit être construit depuis le même commit (`X.Y.Z`, ou `dev-<sha7>` pour un paquet dev, `scripts/contract-version.mjs`). La CI vérifie que `contracts/openapi.json` est exactement la reconstruction du paquet épinglé, sans checkout du BFF.

La reconstruction (`scripts/orval-contract.mjs`) s’exécute hors ligne ; aucun jeton privé ne figure dans les contrats.

## Sources

Configurer `CORE_API_URL` (et `CORE_API_PORT` si nécessaire). Le profil utilise les champs Core `first_name`, `last_name`, `email`, `phone`, sans découper un nom complet. La sauvegarde est relue depuis Core. Les sessions excluent les champs internes. Les autres panneaux indiquent leur indisponibilité ; les adaptateurs de préférences préservent la réponse Core et ne créent aucun stockage local.
