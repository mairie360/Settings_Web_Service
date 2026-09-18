# Contrat web service / BFF

Ce web service consomme **BFF_Settings**. Le contrat est celui publié dans le paquet `@mairie360/bff-settings-openapi`, épinglé à une version exacte dans `package.json` ; [contracts/openapi.json](contracts/openapi.json) en est la reconstruction versionnée et les types TypeScript sont importés depuis le paquet.

## Routes implémentées

Les chemins sont relatifs au BFF. Les proxies web conservent méthode, paramètres, contenu binaire, statuts et cookies. Ce front n’appelle aucun autre BFF : il n’expose pas d’adaptateur de session `/api/*` vers BFF User, la session provient uniquement du cookie `accessToken`. Les pages Next.js sont distinctes des routes de données.

| Méthode | Route | Réponse / schéma |
| --- | --- | --- |
| GET | `/health` | 200 OK |
| GET | `/check_apis` | 200 Services disponibles |
| GET | `/settings/bootstrap` | 200 SettingsBootstrap |
| PATCH | `/settings/profile` | 200 SettingsProfile |
| PATCH | `/settings/notifications` | 200 Préférences enregistrées par Core |
| PATCH | `/settings/appearance` | 200 Préférences enregistrées par Core |
| PATCH | `/settings/general` | 200 Préférences enregistrées par Core |

## Mise à jour et validation

Après une nouvelle version publiée de BFF_Settings, exécuter `npm install --save-exact @mairie360/bff-settings-openapi@X.Y.Z`, puis `npm run contracts:sync`, `npm run contracts:check` et `npm run test:contracts`. La CI vérifie que `contracts/openapi.json` est exactement la reconstruction du paquet épinglé, sans checkout du BFF.

La reconstruction (`scripts/orval-contract.mjs`) s’exécute hors ligne ; aucun jeton privé ne figure dans les contrats.

## Sources

Configurer `CORE_API_URL` (et `CORE_API_PORT` si nécessaire). Le profil utilise les champs Core `first_name`, `last_name`, `email`, `phone`, sans découper un nom complet. La sauvegarde est relue depuis Core. Les sessions excluent les champs internes. Les autres panneaux indiquent leur indisponibilité ; les adaptateurs de préférences préservent la réponse Core et ne créent aucun stockage local.
