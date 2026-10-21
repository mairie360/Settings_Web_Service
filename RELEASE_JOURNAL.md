# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-10-21 11:13 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `a2bf3c6` | 2026-10-21 11:13 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés
- Onglet Sécurité : la section « Double authentification » remplace la simulation SMS / application. Avec `KEYCLOAK_REALM_URL` configurée, elle explique le principe et affiche le lien **Gérer ma double authentification** vers `<realm>/account` (même onglet). Sans cette variable, elle affiche « La double authentification n’est pas disponible sur cette instance. » (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- Onglet Sécurité : le parcours simulé de double authentification (choix SMS / application, faux défi, codes de récupération, désactivation) disparaît. Settings n’affiche plus d’état activé/désactivé et ne propose plus de SMS. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Front : `@mairie360/front-kit` (archive vendorisée) remplacé par `@mairie360/lib-components` 0.10.2 (sous-chemins `next`, `guard`, `browser`, `shared`, `react`, `theme`), sans changement de comportement ; ajout de `npm run test:bundle` (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143)).
- Contrat BFF : `@mairie360/bff-settings-openapi` passé de 0.0.0-dev à 2.0.0 ([#134](https://github.com/mairie360/Settings_Web_Service/pull/134)), puis à 2.1.0 ([#160](https://github.com/mairie360/Settings_Web_Service/pull/160)) ; stacks de test : BFF 2.1.0, core-api 2.2.0 ([#158](https://github.com/mairie360/Settings_Web_Service/pull/158)), database et liquibase 3.3.0 ([#159](https://github.com/mairie360/Settings_Web_Service/pull/159)).
- CI/CD : mairie360/CICD passé de v4.3.1 à v4.4.3 (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141), [#151](https://github.com/mairie360/Settings_Web_Service/pull/151), [#154](https://github.com/mairie360/Settings_Web_Service/pull/154), [#157](https://github.com/mairie360/Settings_Web_Service/pull/157)) ; promotion staging et prod séparée dans `promote-staging.yml` / `promote-prod.yml` (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150)).
- CI : `cicd.yml` et `contracts.yml` ne se déclenchent sur push que pour `main`, permissions en lecture par défaut, `development.Dockerfile` en Node 24.21.0 avec secret BuildKit ; `docker-compose.yml` passe `NODE_AUTH_TOKEN` en secret BuildKit au lieu d’un build-arg (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129)).
- Documentation : les propositions d’endpoints MFA de `BACKEND.md` sont marquées abandonnées (Keycloak, MAIR-357).

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Onglet Sécurité : la section « Double authentification » remplace la simulation SMS / application. Avec `KEYCLOAK_REALM_URL` configurée, elle explique le principe et affiche le lien **Gérer ma double authentification** vers `<realm>/account` (même onglet). Sans cette variable, elle affiche « La double authentification n’est pas disponible sur cette instance. » (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- Onglet Sécurité : le parcours simulé de double authentification (choix SMS / application, faux défi, codes de récupération, désactivation) disparaît. Settings n’affiche plus d’état activé/désactivé et ne propose plus de SMS. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Front : `@mairie360/front-kit` (archive vendorisée) remplacé par `@mairie360/lib-components` 0.10.2 (sous-chemins `next`, `guard`, `browser`, `shared`, `react`, `theme`), sans changement de comportement ; ajout de `npm run test:bundle` (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143)).
- Contrat BFF : `@mairie360/bff-settings-openapi` passé de 0.0.0-dev à 2.0.0 ([#134](https://github.com/mairie360/Settings_Web_Service/pull/134)), puis à 2.1.0 ([#160](https://github.com/mairie360/Settings_Web_Service/pull/160)) ; stacks de test : BFF 2.1.0, core-api 2.2.0 ([#158](https://github.com/mairie360/Settings_Web_Service/pull/158)), database et liquibase 3.3.0 ([#159](https://github.com/mairie360/Settings_Web_Service/pull/159)).
- CI/CD : mairie360/CICD passé de v4.3.1 à v4.4.3 (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141), [#151](https://github.com/mairie360/Settings_Web_Service/pull/151), [#154](https://github.com/mairie360/Settings_Web_Service/pull/154), [#157](https://github.com/mairie360/Settings_Web_Service/pull/157)) ; promotion staging et prod séparée dans `promote-staging.yml` / `promote-prod.yml` (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150)).
- CI : `cicd.yml` et `contracts.yml` ne se déclenchent sur push que pour `main`, permissions en lecture par défaut, `development.Dockerfile` en Node 24.21.0 avec secret BuildKit ; `docker-compose.yml` passe `NODE_AUTH_TOKEN` en secret BuildKit au lieu d’un build-arg (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129)).
- Documentation : les propositions d’endpoints MFA de `BACKEND.md` sont marquées abandonnées (Keycloak, MAIR-357).

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 11:18 UTC | staging | — | `a2bf3c6` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39590420186) |
| 2026-10-21 11:13 UTC | dev | — | `a2bf3c6` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39589446566) |
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
