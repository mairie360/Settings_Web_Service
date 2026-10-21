# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "f6912afc243ff97702132c2e9c028d56e1a674c5", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "891e2fad0cf68e2078376437df51d542d2223490", "updated": {"dev": "2026-10-21 10:45 UTC", "staging": "2026-10-20 18:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `891e2fa` | 2026-10-20 18:18 UTC |
| dev | — | `f6912af` | 2026-10-21 10:45 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés
- Onglet Sécurité : la simulation de double authentification (choix SMS/application, faux défi, codes de récupération, désactivation) est remplacée. Si `KEYCLOAK_REALM_URL` est défini, l'onglet affiche « Gérer ma double authentification », un lien vers `<realm>/account` dans le même onglet ; sinon il affiche « La double authentification n’est pas disponible sur cette instance. ». (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- Un push sur `main` ne publie plus que le dev : staging et prod ne partent plus automatiquement. La promotion est manuelle via `gh workflow run promote-staging.yml -R mairie360/Settings_Web_Service` puis `promote-prod.yml` (option `-f sha=<sha>` pour un commit donné), avec les approbations des environnements `Staging` et `Prod`. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))
- Les workflows `cicd.yml` et `contracts.yml` ne se déclenchent sur `push` que pour `main` ; les branches de PR sont couvertes par `pull_request`. Le jeton des workflows est en lecture seule par défaut. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
- Chaque release écrit désormais `RELEASE_JOURNAL.md` sur `main`, avec un résumé rédigé par Claude, poussé par le bot de release (fonction de CICD v4.3.1, secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK` transmis par ce dépôt). (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136))

#### Corrections
- `docker compose up --build` échouait : le Dockerfile exige le secret BuildKit `node_auth_token`, mais compose passait `NODE_AUTH_TOKEN` en build-arg. Avant : échec du build. Maintenant : compose passe le secret, le jeton n'apparaît plus dans l'historique de l'image. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

#### Technique
- Contrat BFF Settings : `@mairie360/bff-settings-openapi` passe de la build dev à `2.0.0`, et les stacks de test utilisent `bff-settings:2.0.0`, `core-api:2.1.0` puis `2.2.0`, `database` et `liquibase-migrations` en `3.2.0` puis `3.3.0`. Le diff ne montre que des images et des métadonnées. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134), [#151](https://github.com/mairie360/Settings_Web_Service/pull/151), [#158](https://github.com/mairie360/Settings_Web_Service/pull/158), [#159](https://github.com/mairie360/Settings_Web_Service/pull/159))
- Front : migration de `@mairie360/front-kit` vers `@mairie360/lib-components` 0.10.2 (sous-chemins `next`, `guard`, `browser`, `shared`, `react`, `theme`) ; suppression de l'archive vendue ; nouveau test `npm run test:bundle` dans le workflow de performance, qui vérifie le bundle client. Aucun effet fonctionnel visible. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- Pins mairie360/CICD successifs (v4.3.1 à v4.4.3, workflows de promotion séparés) ; tests de pin et règles Renovate mis à jour. (MAIR-571, MAIR-494, [#154](https://github.com/mairie360/Settings_Web_Service/pull/154), [#157](https://github.com/mairie360/Settings_Web_Service/pull/157))
- Dépendances `follow-redirects` 1.16.1 dans le lockfile, selon la description de la PR #150, pour débloquer `npm audit`. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Un push sur `main` ne publie plus que le dev : staging et prod ne partent plus automatiquement. La promotion staging se lance à la main avec `gh workflow run promote-staging.yml -R mairie360/Settings_Web_Service` (option `-f sha=<sha>` pour un commit donné), avec l'approbation de l'environnement `Staging`. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))

#### Technique
- Stacks de test : `core-api` passe de 2.1.0 à 2.2.0, et `database` et `liquibase-migrations` de 3.2.0 à 3.3.0. Le diff ne montre que les tags d'image, pas le contenu du schéma. (MAIR-569, [#158](https://github.com/mairie360/Settings_Web_Service/pull/158), [#159](https://github.com/mairie360/Settings_Web_Service/pull/159))
- Pins mairie360/CICD : v4.4.0, v4.4.1 puis v4.4.3 dans `cicd.yml`, `dev-dependency-exception.yml`, `promote-staging.yml` et `promote-prod.yml`. `renovate.json` et `tests/cicd-pin.test.cjs` couvrent les huit références. (MAIR-494, [#151](https://github.com/mairie360/Settings_Web_Service/pull/151), [#154](https://github.com/mairie360/Settings_Web_Service/pull/154), [#157](https://github.com/mairie360/Settings_Web_Service/pull/157))
- Dépendance `follow-redirects` 1.16.1 dans le lockfile, selon la description de la PR #150. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Onglet Sécurité : « Double authentification » remplace la simulation. Si `KEYCLOAK_REALM_URL` est défini, un lien « Gérer ma double authentification » ouvre `<realm>/account` dans le même onglet ; sinon le message « La double authentification n’est pas disponible sur cette instance. » s'affiche. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- Onglet Sécurité : la simulation d'authentification à deux facteurs (SMS ou application, faux défi, codes de récupération, désactivation) disparaît, ainsi que les membres MFA de `SettingsFeaturePort`. Il n'y a plus d'état activé/désactivé. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Nouvelle variable d'environnement `KEYCLOAK_REALM_URL` (URL publique du realm, HTTPS uniquement, sauf hôte local en développement). Absente ou invalide, le lien est masqué. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Un push sur `main` ne publie plus que le dev, et la promotion staging ou prod est manuelle, avec les approbations des environnements `Staging` et `Prod`. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))
- Les workflows `cicd.yml` et `contracts.yml` ne se déclenchent sur `push` que pour `main`. Le jeton des workflows est en lecture seule par défaut. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
- Chaque release écrit `RELEASE_JOURNAL.md` sur `main`, avec un résumé rédigé par Claude. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136))
- Contrat BFF Settings : la source passe de la build dev `0.0.0-dev.6d72619…` à `2.0.0`. Les stacks de test démarrent `bff-settings:2.0.0` au lieu de `dev-6d72619`. Le diff ne montre que des métadonnées et des images, sans changement de routes. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))

#### Corrections
- `docker compose up --build` échouait : le Dockerfile exige le secret BuildKit `node_auth_token`, mais compose passait `NODE_AUTH_TOKEN` en build-arg. Maintenant compose passe le secret, et le jeton n'apparaît plus dans l'historique de l'image. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

#### Technique
- Stacks de test : `core-api` passe à 2.1.0, `database` et `liquibase-migrations` à 3.2.0, en remplacement de builds `dev-*` figées. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- Front : migration de `@mairie360/front-kit` vers `@mairie360/lib-components` 0.10.2, suppression de l'archive vendue, et nouveau test de bundle (`npm run test:bundle`) lancé par le workflow de performance. Aucun effet fonctionnel visible. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- `development.Dockerfile` passe à Node 24.21.0 épinglé par digest, avec le secret BuildKit pour `npm ci`. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
- Pins mairie360/CICD v4.3.2 à v4.4.1 et règles Renovate associées. (MAIR-571, MAIR-494, [#141](https://github.com/mairie360/Settings_Web_Service/pull/141), [#151](https://github.com/mairie360/Settings_Web_Service/pull/151))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 10:45 UTC | dev | — | `f6912af` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39584985877) |
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
