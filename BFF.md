# Contrat web service / BFF

Ce web service consomme **BFF_Settings**. La copie [OpenAPI](contracts/openapi.json) définit les routes et les données échangées ; les [types TypeScript](src/contracts/bff.d.ts) sont générés depuis cette copie.

## Routes implémentées

Les chemins sont relatifs au BFF. Les proxies web conservent méthode, paramètres, contenu binaire, statuts et cookies. Les chemins `/api/auth/*` restent des adaptateurs de session vers BFF User ; les pages Next.js sont distinctes des routes de données.

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

Dans le BFF associé, exécuter `npm run contracts:generate`. Dans ce web service, exécuter `npm run contracts:sync`, puis `npm run contracts:check` et `npm run test:contracts`. Les dépôts peuvent être voisins ; sinon `BFF_CONTRACT_DIR` indique le répertoire `contracts` du BFF. La CI vérifie que les types correspondent au document livré, même sans checkout du dépôt voisin.

Le générateur de types est fixé à `openapi-typescript@7.10.1`. Il est exécuté via npm ; aucun jeton privé ne figure dans les contrats.

## Sources

Configurer `CORE_API_URL` (et `CORE_API_PORT` si nécessaire). Le profil utilise les champs Core `first_name`, `last_name`, `email`, `phone`, sans découper un nom complet. La sauvegarde est relue depuis Core. Les sessions excluent les champs internes. Les autres panneaux indiquent leur indisponibilité ; les adaptateurs de préférences préservent la réponse Core et ne créent aucun stockage local.
