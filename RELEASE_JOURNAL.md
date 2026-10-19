# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "1304b75e575d3014f9c97db36f1290336e3c5080", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "3e6410991fb271011a2248fa3ba17c778250bc3b", "updated": {"dev": "2026-10-19 20:09 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `3e64109` | — |
| dev | — | `1304b75` | 2026-10-19 20:09 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Technique
- Contrat `@mairie360/bff-settings-openapi` aligné sur sa release prod `2.0.0` (au lieu de `0.0.0-dev.6d726190fa0a1d5d4db5a7e0c500b46bd832ca41`). Dans `contracts/openapi.json`, seule la métadonnée `x-source-package` change, sans route ni champ modifié. Les stacks `docker-compose*.yml` démarrent désormais les images prod `bff-settings:2.0.0`, `core-api:2.1.0`, `database:3.2.0` et `liquibase-migrations:3.2.0`. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- Durcissement CI et images de dev issu de l'audit (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129)) :
  - jeton de workflow en lecture seule par défaut, droits d'écriture réservés au job `CICD` ;
  - `cicd.yml` et `contracts.yml` ne tournent plus sur `push` que pour `main` ;
  - `development.Dockerfile` passe à Node 24.21.0 épinglé par digest, avec le secret BuildKit `node_auth_token` ;
  - `docker-compose.yml` transmet `NODE_AUTH_TOKEN` en secret BuildKit et non plus en build-arg, ce qui fait de nouveau fonctionner `docker compose up --build` ;
  - tests et documentation mis à jour.
- Workflow partagé `mairie360/CICD` passé en v4.3.1, qui ajoute l'étape de journal des releases (`RELEASE_JOURNAL.md`), avec les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK`. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136))

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Contrat `@mairie360/bff-settings-openapi` aligné sur sa release prod `2.0.0` (au lieu de `0.0.0-dev.6d726190fa0a1d5d4db5a7e0c500b46bd832ca41`). Dans `contracts/openapi.json`, seule la métadonnée `x-source-package` change, sans route ni champ modifié. Les stacks `docker-compose*.yml` démarrent désormais les images prod `bff-settings:2.0.0`, `core-api:2.1.0`, `database:3.2.0` et `liquibase-migrations:3.2.0`. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- Durcissement CI et images de dev issu de l'audit (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129)) :
  - jeton de workflow en lecture seule par défaut, droits d'écriture réservés au job `CICD` ;
  - `cicd.yml` et `contracts.yml` ne tournent plus sur `push` que pour `main` ;
  - `development.Dockerfile` passe à Node 24.21.0 épinglé par digest, avec le secret BuildKit `node_auth_token` ;
  - `docker-compose.yml` transmet `NODE_AUTH_TOKEN` en secret BuildKit et non plus en build-arg, ce qui fait de nouveau fonctionner `docker compose up --build` ;
  - tests et documentation mis à jour.
- Workflow partagé `mairie360/CICD` passé en v4.3.1, qui ajoute l'étape de journal des releases (`RELEASE_JOURNAL.md`), avec les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK`. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 20:09 UTC | dev | — | `1304b75` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39316027226) |
<!-- release-journal-history:end -->
