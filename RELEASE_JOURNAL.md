# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "a3c70050a9c3f1a025b23ff9dc72e83f1951c1d1", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "3e6410991fb271011a2248fa3ba17c778250bc3b", "updated": {"dev": "2026-10-19 22:02 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `3e64109` | — |
| dev | — | `a3c7005` | 2026-10-19 22:02 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Technique
- 2 mises à jour de dépendances, sans changement de comportement visible : le socle partagé (session, proxy, garde, thème) vient désormais de `@mairie360/lib-components` `0.10.2` au lieu de l'archive `@mairie360/front-kit` ; le contrat `@mairie360/bff-settings-openapi` passe en `2.0.0` (seule la référence source change dans `contracts/openapi.json`) ; les stacks `docker-compose*.yml` utilisent les images prod. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138) ; MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- 2 changements de CI et d'outillage : CICD passe en v4.3.1 avec l'étape de journal de release ; le jeton du workflow est en lecture seule par défaut ; les pipelines ne tournent sur `push` que pour `main` ; l'image de dev passe en Node 24.21.0 avec le secret BuildKit `node_auth_token` ; `docker compose up --build`, qui échouait, fonctionne à nouveau ; des tests ont été ajoutés. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136) ; MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- 2 mises à jour de dépendances, sans changement de comportement visible : le socle partagé (session, proxy, garde, thème) vient désormais de `@mairie360/lib-components` `0.10.2` au lieu de l'archive `@mairie360/front-kit` ; le contrat `@mairie360/bff-settings-openapi` passe en `2.0.0` (seule la référence source change dans `contracts/openapi.json`) ; les stacks `docker-compose*.yml` utilisent les images prod. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138) ; MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- 2 changements de CI et d'outillage : CICD passe en v4.3.1 avec l'étape de journal de release ; le jeton du workflow est en lecture seule par défaut ; les pipelines ne tournent sur `push` que pour `main` ; l'image de dev passe en Node 24.21.0 avec le secret BuildKit `node_auth_token` ; `docker compose up --build`, qui échouait, fonctionne à nouveau ; des tests ont été ajoutés. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136) ; MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 22:02 UTC | dev | — | `a3c7005` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39331022273) |
| 2026-10-19 20:09 UTC | dev | — | `1304b75` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39316027226) |
<!-- release-journal-history:end -->
