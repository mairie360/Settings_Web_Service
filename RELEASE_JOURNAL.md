# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "eab97acf63024a7e123ae589c9d38b3b54d9ff19", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "891e2fad0cf68e2078376437df51d542d2223490", "updated": {"dev": "2026-10-21 05:01 UTC", "staging": "2026-10-20 18:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `891e2fa` | 2026-10-20 18:18 UTC |
| dev | — | `eab97ac` | 2026-10-21 05:01 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés
- Onglet Sécurité : la section « Double authentification » renvoie vers le compte Keycloak de l'agent (**Gérer ma double authentification**, lien `<realm>/account`) quand `KEYCLOAK_REALM_URL` est configurée. Sans elle, le message « La double authentification n’est pas disponible sur cette instance. » s'affiche. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Après chaque release, CICD réécrit `RELEASE_JOURNAL.md` sur `main` avec un résumé rédigé par Claude. Le workflow reçoit désormais les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK`. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136))
- Promotion manuelle vers staging et prod via `promote-staging.yml` et `promote-prod.yml` (`gh workflow run … [-f sha=<sha>]`), avec un verrou par cible. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))

#### Changements de comportement
- La simulation de double authentification est retirée de l'onglet Sécurité : plus de choix SMS / application, de faux défi, de codes de récupération ni de désactivation. Les membres MFA de `SettingsFeaturePort` sont supprimés. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Contrat `@mairie360/bff-settings-openapi` : par rapport à la prod, la dépendance et `x-source-package` de `contracts/openapi.json` passent de `0.0.0-dev.6d726190…` à `0.0.0-dev.bdc4a888…`. La `2.0.0` introduite par #134 est retirée par #145 dans la même plage. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134) ; MAIR-575, [#145](https://github.com/mairie360/Settings_Web_Service/pull/145))
- Push sur `main` : `cicd.yml` ne lance plus que la release dev et s'arrête à `release-dev`. Staging et prod ne sont plus déclenchés automatiquement. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))
- `cicd.yml` et `contracts.yml` ne tournent sur `push` que pour `main`. Une branche de PR n'exécute plus son pipeline deux fois. Le token du workflow est en lecture seule par défaut. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

#### Corrections
- `docker compose up --build` : avant, `docker-compose.yml` passait `NODE_AUTH_TOKEN` en build-arg, alors que le Dockerfile ne le lisait plus et exigeait le secret, et le build échouait. Maintenant, le compose passe le secret BuildKit `node_auth_token`, alimenté par la variable `NODE_AUTH_TOKEN` exportée avant le lancement. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

#### Technical
- Le socle front `@mairie360/front-kit` (archive vendorée 0.1.0) est remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2. L'archive et sa provenance sont supprimées, et `npm run test:bundle` est lancé par `frontend-performance.yml`. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- Stacks de test (`docker-compose*.yml`) : `core-api` passe en 2.1.0, `database` et `liquibase-migrations` en 3.2.0, et `bff-settings` suit le contrat. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134) ; MAIR-575, [#145](https://github.com/mairie360/Settings_Web_Service/pull/145))
- CICD est épinglé par SHA avec son tag : v4.3.1, puis v4.3.2, v4.4.0 et v4.4.1 (`75e4fc4`) dans `cicd.yml`, `dev-dependency-exception.yml`, `promote-staging.yml` et `promote-prod.yml`. Les tests `tests/cicd-pin.test.cjs` et `tests/workflow-permissions.test.cjs` verrouillent ces pins. (MAIR-571, MAIR-494, MAIR-436)
- `development.Dockerfile` passe à Node 24.21.0 épinglé par digest, avec le secret BuildKit requis ; `tests/dev-image-secret.test.cjs` vérifie ce câblage. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Un push sur `main` ne lance plus que la release dev : `cicd.yml` s'arrête à `release-dev`, et staging et prod ne sont plus déclenchés automatiquement. La promotion devient manuelle via `promote-staging.yml` et `promote-prod.yml` (`-f sha=<sha>` optionnel, verrou par cible). Staging refuse un commit sans image `dev-<sha>` et sans run vert sur `main`. Les environnements `Staging` et `Prod` gardent leur approbation. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))

#### Technical
- `mairie360/CICD` passe à v4.4.0 (#151) puis v4.4.1 (commit `75e4fc4`, #154) dans `cicd.yml`, `dev-dependency-exception.yml`, `promote-staging.yml` et `promote-prod.yml`. Les références restent alignées via Renovate. (MAIR-494, [#151](https://github.com/mairie360/Settings_Web_Service/pull/151), [#154](https://github.com/mairie360/Settings_Web_Service/pull/154))
- `tests/cicd-pin.test.cjs` attend désormais 8 références CICD, et `renovate.json` couvre les deux fichiers de promotion. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Double authentification : l'onglet Sécurité renvoie vers le compte Keycloak (**Gérer ma double authentification**) quand `KEYCLOAK_REALM_URL` est configurée, sinon affiche « La double authentification n’est pas disponible sur cette instance. » (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Après chaque release, CICD réécrit `RELEASE_JOURNAL.md` sur `main` avec un résumé rédigé par Claude, grâce aux secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` transmis au workflow. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136))

#### Changements de comportement
- La simulation de double authentification est retirée de l'onglet Sécurité : plus de choix SMS / application, de faux défi, de codes de récupération ni de désactivation. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Contrat `@mairie360/bff-settings-openapi` : par rapport à la prod, la dépendance passe de `0.0.0-dev.6d726190…` à `0.0.0-dev.bdc4a888…`. La `2.0.0` introduite par #134 est retirée par #145 dans la même plage. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134) ; MAIR-575, [#145](https://github.com/mairie360/Settings_Web_Service/pull/145))
- `cicd.yml` et `contracts.yml` ne tournent sur `push` que pour `main`. Une branche de PR n'exécute plus son pipeline deux fois. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

#### Corrections
- `docker compose up --build` : avant, `NODE_AUTH_TOKEN` passait en build-arg alors que le Dockerfile exigeait le secret, et le build échouait. Maintenant, le compose passe le secret BuildKit `node_auth_token`. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

#### Technical
- Le socle front `@mairie360/front-kit` (archive vendorée) est remplacé par `@mairie360/lib-components` 0.10.2 (sous-chemins `next`, `guard`, `browser`, `shared`, `react`, `theme`). Un test de bundle est ajouté. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- Stacks de test : `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- CICD passe à v4.3.1 puis v4.3.2 avec pins par SHA et tags, et la régle Renovate couvre `cicd_version` et `cicd_ref`. Les secrets de release journal sont ajoutés. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141))
- `development.Dockerfile` passe à Node 24.21.0 épinglé par digest, avec le secret BuildKit requis, et les permissions CI sont restreintes au job CICD. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
