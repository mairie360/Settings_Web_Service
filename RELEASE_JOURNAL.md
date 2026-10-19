# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "88d755d546daed8c821b5e160bb90d25a8d34ebe", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "3e6410991fb271011a2248fa3ba17c778250bc3b", "updated": {"dev": "2026-10-19 22:15 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `3e64109` | — |
| dev | — | `88d755d` | 2026-10-19 22:15 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Technique
- Dépendances, sans changement de comportement visible dans les diffs (5 commits au total) :
  - Le socle front partagé est désormais importé depuis `@mairie360/lib-components/<entry>` (`next`, `guard`, `browser`, `shared`, `react`, `theme`), épinglé à `0.10.2`, au lieu de `@mairie360/front-kit`. L'archive `vendor/mairie360-front-kit-0.1.0.tgz` est supprimée.
  - Le contrat `@mairie360/bff-settings-openapi` passe de `0.0.0-dev.6d72619…` à `2.0.0` ; dans `contracts/openapi.json`, seul `x-source-package` change.
  - Les stacks `docker-compose*.yml` utilisent les images de release `bff-settings:2.0.0`, `core-api:2.1.0`, `database:3.2.0` et `liquibase-migrations:3.2.0`.
  - (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138) ; MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- CI et outillage :
  - Nouveau test `npm run test:bundle`, lancé après le build de production. Il vérifie que le bundle client n'embarque aucune entrée inutilisée de la lib ni son code serveur, et analyse désormais les imports via l'AST TypeScript.
  - Passage au workflow `mairie360/CICD` v4.3.1, qui ajoute le journal des releases.
  - Le jeton du workflow est en lecture seule par défaut et les pipelines ne tournent en `push` que sur `main`.
  - `development.Dockerfile` passe à Node 24.21.0, épinglé par digest. Le token npm est transmis en secret BuildKit, y compris dans `docker-compose.yml`, ce qui répare `docker compose up --build`.
  - (MAIR-126, [#143](https://github.com/mairie360/Settings_Web_Service/pull/143) ; MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136) ; MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Dépendances, sans changement de comportement visible dans les diffs (5 commits au total) :
  - Le socle front partagé est désormais importé depuis `@mairie360/lib-components/<entry>` (`next`, `guard`, `browser`, `shared`, `react`, `theme`), épinglé à `0.10.2`, au lieu de `@mairie360/front-kit`. L'archive `vendor/mairie360-front-kit-0.1.0.tgz` est supprimée.
  - Le contrat `@mairie360/bff-settings-openapi` passe de `0.0.0-dev.6d72619…` à `2.0.0` ; dans `contracts/openapi.json`, seul `x-source-package` change.
  - Les stacks `docker-compose*.yml` utilisent les images de release `bff-settings:2.0.0`, `core-api:2.1.0`, `database:3.2.0` et `liquibase-migrations:3.2.0`.
  - (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138) ; MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- CI et outillage :
  - Nouveau test `npm run test:bundle`, lancé après le build de production. Il vérifie que le bundle client n'embarque aucune entrée inutilisée de la lib ni son code serveur, et analyse désormais les imports via l'AST TypeScript.
  - Passage au workflow `mairie360/CICD` v4.3.1, qui ajoute le journal des releases.
  - Le jeton du workflow est en lecture seule par défaut et les pipelines ne tournent en `push` que sur `main`.
  - `development.Dockerfile` passe à Node 24.21.0, épinglé par digest. Le token npm est transmis en secret BuildKit, y compris dans `docker-compose.yml`, ce qui répare `docker compose up --build`.
  - (MAIR-126, [#143](https://github.com/mairie360/Settings_Web_Service/pull/143) ; MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136) ; MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 22:15 UTC | dev | — | `88d755d` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39333039530) |
| 2026-10-19 22:02 UTC | dev | — | `a3c7005` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39331022273) |
| 2026-10-19 20:09 UTC | dev | — | `1304b75` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39316027226) |
<!-- release-journal-history:end -->
