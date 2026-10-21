# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "159b7f91f436ad18d6515ea36d1d39466c4eac51", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "891e2fad0cf68e2078376437df51d542d2223490", "updated": {"dev": "2026-10-21 01:45 UTC", "staging": "2026-10-20 18:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `891e2fa` | 2026-10-20 18:18 UTC |
| dev | — | `159b7f9` | 2026-10-21 01:45 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés
- Onglet Sécurité : la simulation d’authentification à deux facteurs (SMS ou application, faux défi, codes de récupération, désactivation) est remplacée par « Double authentification ». Avec `KEYCLOAK_REALM_URL` configurée, l’onglet explique la gestion du second facteur et propose le lien **Gérer ma double authentification** vers `<realm>/account` (même onglet). Sans cette variable, il affiche « La double authentification n’est pas disponible sur cette instance. ». Aucun SMS ni état activé/désactivé n’est affiché. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Variable `KEYCLOAK_REALM_URL` : URL publique du realm, lue côté serveur ; HTTPS uniquement (HTTP accepté pour un hôte local), chemin `…/realms/<realm>`, sans identifiants, requête ni fragment. Absente ou invalide, le lien est masqué. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- `cicd.yml` et `contracts.yml` ne se lancent plus sur un push de branche : seuls `pull_request`, `workflow_dispatch` et le push sur `main` déclenchent le pipeline. Une PR ne fait plus tourner deux fois la CI. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

#### Corrections
- `docker compose up --build` en local : avant, le build échouait car le `Dockerfile` exigeait le secret BuildKit `node_auth_token` alors que compose passait `NODE_AUTH_TOKEN` en build arg. Maintenant compose passe le secret ; il faut exporter le token : `NODE_AUTH_TOKEN=<token> docker compose up --build`. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
- `npm audit` bloquait chaque run sur `main` : `follow-redirects` passe en 1.16.1 dans le lockfile (GHSA-q3jh-wrc6-jgq8, GHSA-8r9p-f939-6h3c), d’après la description de la PR (le lockfile n’apparaît pas dans le diff fourni). (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))

#### Technique
- Le front n’importe plus `@mairie360/front-kit` (archive vendorisée supprimée) mais les sous-chemins `@mairie360/lib-components/<entry>` en 0.10.2, sans changement de comportement ; `npm run test:bundle` vérifie le bundle client dans le workflow `frontend-performance`. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- Contrat BFF Settings aligné sur la version 2.0.0 et stacks Docker de test passées sur `core-api` 2.1.0, `database` 3.2.0 et `liquibase-migrations` 3.2.0. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- Dépendance `@mairie360/bff-settings-openapi` repassée sur un build `0.0.0-dev.bdc4a88…` et image `bff-settings:dev-bdc4a88` dans les stacks de test : le pin sur main vise donc un build dev, pas la 2.0.0. (MAIR-575, [#145](https://github.com/mairie360/Settings_Web_Service/pull/145))
- Workflows CICD sur `mairie360/CICD` v4.3.1 puis v4.3.2 (SHA épinglé avec commentaire de tag, suivi par Renovate), secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` transmis pour le journal de release. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141))
- Dépôt : `development.Dockerfile` passe de Node 23.10 à Node 24.21.0 épinglé par digest, avec le secret BuildKit pour `npm ci` ; permissions CI en lecture seule par défaut, et tests `workflow-permissions` et `dev-image-secret` ajoutés. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
- Retrait des membres MFA de `SettingsFeaturePort` et mise à jour de la documentation EN/FR. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Tests : `tests/cicd-pin.test.cjs` vérifie la cohérence des huit références CICD ; `tests/bundle/client-bundle.test.cjs` lit les imports via l’AST TypeScript. (MAIR-494, MAIR-126)

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Processus de release (pas le service lui-même) : un push sur `main` ne déclenche plus que la release dev, `cicd.yml` s’arrêtant à `release-dev`. Staging et prod se lancent à la main : `gh workflow run promote-staging.yml -R mairie360/Settings_Web_Service` (ou avec `-f sha=<sha>`), puis `promote-prod.yml`. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))

#### Technique
- Nouveaux workflows `promote-staging.yml` et `promote-prod.yml` (`workflow_dispatch`, input `sha` optionnel, verrou par cible), qui appellent le workflow `mairie360/CICD` v4.4.0 ; `renovate.json`, `tests/cicd-pin.test.cjs` et `CLAUDE.md` suivent. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))
- Bump de `mairie360/CICD` de v4.3.2 à v4.4.0 dans `cicd.yml` et `dev-dependency-exception.yml` (PR Renovate sans clé Jira, [#151](https://github.com/mairie360/Settings_Web_Service/pull/151)).
- `follow-redirects` 1.16.1 dans le lockfile pour débloquer `npm audit`, d’après la description de la PR. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150))

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Onglet Sécurité : la simulation d’authentification à deux facteurs (SMS ou application, faux défi, codes de récupération, désactivation) est remplacée par « Double authentification ». Avec `KEYCLOAK_REALM_URL` configurée, un lien **Gérer ma double authentification** ouvre `<realm>/account` dans le même onglet ; sans cette variable, le message « La double authentification n’est pas disponible sur cette instance. » s’affiche. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Variable `KEYCLOAK_REALM_URL` : URL publique du realm, validée côté serveur (HTTPS, chemin `…/realms/<realm>`, sans identifiants, requête ni fragment) ; absente ou invalide, le lien est masqué. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- `cicd.yml` et `contracts.yml` ne se lancent plus sur un push de branche, seulement sur `pull_request`, `workflow_dispatch` et le push sur `main`. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

#### Corrections
- `docker compose up --build` en local : avant, le build échouait car le `Dockerfile` exigeait le secret BuildKit `node_auth_token` alors que compose passait `NODE_AUTH_TOKEN` en build arg. Maintenant compose passe le secret : `NODE_AUTH_TOKEN=<token> docker compose up --build`. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))

#### Technique
- Le front utilise `@mairie360/lib-components` 0.10.2 (sous-chemins `next`, `guard`, `browser`, `shared`, `react`, `theme`) à la place de `@mairie360/front-kit`, sans changement de comportement ; `npm run test:bundle` est lancé par le workflow `frontend-performance`. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- Contrat BFF Settings en 2.0.0 et stacks de test sur `core-api` 2.1.0, `database` 3.2.0 et `liquibase-migrations` 3.2.0. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- Dépendance `@mairie360/bff-settings-openapi` sur un build `0.0.0-dev.bdc4a88…` et image `bff-settings:dev-bdc4a88` dans les stacks de test. (MAIR-575, [#145](https://github.com/mairie360/Settings_Web_Service/pull/145))
- Workflows CICD sur `mairie360/CICD` v4.3.2 (SHA épinglé, suivi par Renovate) avec les secrets du journal de release (`ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`). (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141))
- `development.Dockerfile` passe de Node 23.10 à Node 24.21.0 épinglé par digest, avec secret BuildKit pour `npm ci` ; tests `workflow-permissions` et `dev-image-secret` ajoutés. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
- Retrait des membres MFA de `SettingsFeaturePort` et mise à jour de la documentation EN/FR. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 01:45 UTC | dev | — | `159b7f9` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39528260272) |
| 2026-10-20 18:18 UTC | staging | — | `891e2fa` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39427485154) |
| 2026-10-20 13:12 UTC | dev | — | `891e2fa` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39427485154) |
| 2026-10-20 12:24 UTC | dev | — | `dbc6d6c` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39421349929) |
| 2026-10-19 22:29 UTC | dev | — | `c1adb82` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39334721734) |
| 2026-10-19 22:15 UTC | dev | — | `88d755d` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39333039530) |
| 2026-10-19 22:02 UTC | dev | — | `a3c7005` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39331022273) |
| 2026-10-19 20:09 UTC | dev | — | `1304b75` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39316027226) |
<!-- release-journal-history:end -->
