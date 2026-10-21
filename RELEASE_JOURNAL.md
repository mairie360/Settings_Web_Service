# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "96d081d6a76a0a11bd241a67f02e108936a1f047", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "891e2fad0cf68e2078376437df51d542d2223490", "updated": {"dev": "2026-10-21 10:44 UTC", "staging": "2026-10-20 18:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `891e2fa` | 2026-10-20 18:18 UTC |
| dev | — | `96d081d` | 2026-10-21 10:44 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés

- Onglet Sécurité : quand `KEYCLOAK_REALM_URL` est configurée, un lien « Gérer ma double authentification » ouvre le compte Keycloak (`<realm>/account`, même onglet). Sans cette variable, le message « La double authentification n’est pas disponible sur cette instance. » s’affiche. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement

- L’ancienne double authentification simulée (choix SMS / application, faux défi, codes de récupération, désactivation) disparaît de l’onglet Sécurité ; Settings n’affiche plus d’état activé/désactivé. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Un push sur `main` ne release plus que le dev : le pipeline CICD s’arrête à `release-dev`, et staging puis prod passent par les workflows manuels `promote-staging.yml` et `promote-prod.yml`. Changement du processus de release, pas de l’application. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))
- `docker compose up --build` ne passe plus `NODE_AUTH_TOKEN` en argument de build mais comme secret BuildKit : il faut exporter `NODE_AUTH_TOKEN` avant de construire l’image. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
- Les workflows `cicd.yml` et `contracts.yml` ne se lancent plus sur `push` que pour `main` ; les branches de PR ne sont couvertes que par `pull_request`. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

#### Technical

- Mises à jour de mairie360/CICD de v4.3.1 à v4.4.3 (Renovate et MAIR-571 / MAIR-494). La v4.3.1 ajoute une étape « Release journal » qui réécrit `RELEASE_JOURNAL.md` sur `main` ; les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` sont transmis au workflow. ([#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141), [#151](https://github.com/mairie360/Settings_Web_Service/pull/151), [#154](https://github.com/mairie360/Settings_Web_Service/pull/154), [#157](https://github.com/mairie360/Settings_Web_Service/pull/157))
- Dépendance `@mairie360/bff-settings-openapi` passée d’un build dev à `2.0.0`, et images `bff-settings` des stacks de test alignées (`dev-bdc4a88` puis `2.0.0`). Dans `contracts/openapi.json`, seule la métadonnée `x-source-package` change dans le diff. ([#134](https://github.com/mairie360/Settings_Web_Service/pull/134), [#145](https://github.com/mairie360/Settings_Web_Service/pull/145))
- Images des stacks de test : `database` et `liquibase-migrations` en 3.2.0, `core-api` en 2.1.0 puis 2.2.0. ([#134](https://github.com/mairie360/Settings_Web_Service/pull/134), [#158](https://github.com/mairie360/Settings_Web_Service/pull/158))
- Migration de `@mairie360/front-kit` (archive vendored) vers `@mairie360/lib-components` 0.10.2, sous-chemins `next`, `guard`, `browser`, `shared`, `react` et `theme`, sans changement de comportement annoncé ; archive supprimée. Ajout d’un test de bundle client (`npm run test:bundle`) lancé par le workflow de performance. ([#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- Workflows `promote-staging.yml` / `promote-prod.yml` ajoutés et test `tests/cicd-pin.test.cjs` étendu aux huit références CICD. ([#150](https://github.com/mairie360/Settings_Web_Service/pull/150))
- Durcissement CI (permissions en lecture seule par défaut, écriture accordée au seul job de release) et Dockerfile de dev en Node 24.21.0 épinglé par digest, avec tests dédiés. ([#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement

- Un push sur `main` ne release plus que le dev : le pipeline CICD s’arrête à `release-dev`, et staging puis prod passent par les workflows manuels `promote-staging.yml` et `promote-prod.yml`, avec approbation des environnements `Staging` et `Prod`. Changement du processus de release, pas de l’application. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))

#### Technical

- Mises à jour de mairie360/CICD de v4.4.0 à v4.4.3 (Renovate), avec `uses:` et `cicd_version` / `cicd_ref` épinglés sur le même commit et tag ; `tests/cicd-pin.test.cjs` vérifie cette cohérence. ([#151](https://github.com/mairie360/Settings_Web_Service/pull/151), [#154](https://github.com/mairie360/Settings_Web_Service/pull/154), [#157](https://github.com/mairie360/Settings_Web_Service/pull/157))
- Image `ghcr.io/mairie360/core-api` des trois `docker-compose*.yml` passée de 2.1.0 à 2.2.0. ([#158](https://github.com/mairie360/Settings_Web_Service/pull/158))
- Ajout de `promote-staging.yml` et `promote-prod.yml` (dispatch manuel, verrou par cible) et mise à jour de `CLAUDE.md` sur la promotion. ([#150](https://github.com/mairie360/Settings_Web_Service/pull/150))

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés

- Onglet Sécurité : quand `KEYCLOAK_REALM_URL` est configurée, un lien « Gérer ma double authentification » ouvre le compte Keycloak (`<realm>/account`, même onglet). Sans cette variable, le message « La double authentification n’est pas disponible sur cette instance. » s’affiche. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement

- L’ancienne double authentification simulée (choix SMS / application, faux défi, codes de récupération, désactivation) disparaît de l’onglet Sécurité. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- `docker compose up --build` ne passe plus `NODE_AUTH_TOKEN` en argument de build mais comme secret BuildKit : il faut exporter `NODE_AUTH_TOKEN` avant de construire l’image. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
- Les workflows `cicd.yml` et `contracts.yml` ne se lancent plus sur `push` que pour `main`. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

#### Technical

- Mise à jour de mairie360/CICD à v4.3.1 puis v4.3.2 (MAIR-571) : étape « Release journal » qui réécrit `RELEASE_JOURNAL.md` sur `main`, avec transmission des secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK`. ([#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141))
- Dépendance `@mairie360/bff-settings-openapi` passée d’un build dev à `2.0.0`, images `bff-settings` des stacks de test en `2.0.0`. Dans `contracts/openapi.json`, seule la métadonnée `x-source-package` change dans le diff visible. ([#134](https://github.com/mairie360/Settings_Web_Service/pull/134), [#145](https://github.com/mairie360/Settings_Web_Service/pull/145))
- Images des stacks de test : `database` et `liquibase-migrations` en 3.2.0, `core-api` en 2.1.0. ([#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- Migration de `@mairie360/front-kit` vers `@mairie360/lib-components` 0.10.2 (sous-chemins `next`, `guard`, `browser`, `shared`, `react`, `theme`), sans changement de comportement annoncé ; archive vendored supprimée. Ajout de `npm run test:bundle` au workflow de performance. ([#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- Durcissement CI (permissions en lecture seule par défaut) et Dockerfile de dev passé en Node 24.21.0 épinglé par digest. ([#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 10:44 UTC | dev | — | `96d081d` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39584855656) |
| 2026-10-21 09:22 UTC | dev | — | `c14bf72` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39575711437) |
| 2026-10-21 05:01 UTC | dev | — | `eab97ac` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39546748272) |
| 2026-10-21 01:45 UTC | dev | — | `159b7f9` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39528260272) |
| 2026-10-20 18:18 UTC | staging | — | `891e2fa` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39427485154) |
| 2026-10-20 13:12 UTC | dev | — | `891e2fa` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39427485154) |
| 2026-10-20 12:24 UTC | dev | — | `dbc6d6c` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39421349929) |
| 2026-10-19 22:29 UTC | dev | — | `c1adb82` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39334721734) |
| 2026-10-19 22:15 UTC | dev | — | `88d755d` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39333039530) |
| 2026-10-19 22:02 UTC | dev | — | `a3c7005` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39331022273) |
| 2026-10-19 20:09 UTC | dev | — | `1304b75` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39316027226) |
<!-- release-journal-history:end -->
