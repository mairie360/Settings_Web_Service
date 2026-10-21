# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "c14bf72eadf5a6284839eeaa1b8f5f2997794ef9", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "891e2fad0cf68e2078376437df51d542d2223490", "updated": {"dev": "2026-10-21 09:22 UTC", "staging": "2026-10-20 18:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `891e2fa` | 2026-10-20 18:18 UTC |
| dev | — | `c14bf72` | 2026-10-21 09:22 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Changements de comportement
- Onglet Sécurité : la simulation « Authentification à deux facteurs » (SMS / application, défi factice, codes de récupération, désactivation) est remplacée par « Double authentification ». Avec `KEYCLOAK_REALM_URL`, l’onglet explique la gestion du second facteur et propose le lien **Gérer ma double authentification** vers `<realm>/account` (même onglet). Sans cette variable, il affiche « La double authentification n’est pas disponible sur cette instance. » (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Nouvelle variable `KEYCLOAK_REALM_URL` : URL publique du realm, HTTPS uniquement (HTTP accepté seulement pour un hôte local). Absente ou invalide, le lien est masqué. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Promotion des déploiements : un push sur `main` ne lance plus que la release dev. Staging et prod se déclenchent à la main via `promote-staging.yml` et `promote-prod.yml` (`gh workflow run … [-f sha=<sha>]`), avec approbation de l’environnement. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150), [#151](https://github.com/mairie360/Settings_Web_Service/pull/151))

#### Technique
- Contrat : `@mairie360/bff-settings-openapi` passe de `0.0.0-dev.6d72619…` à `2.0.0` (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134)), puis à un build dev `0.0.0-dev.bdc4a88…` (MAIR-575, [#145](https://github.com/mairie360/Settings_Web_Service/pull/145)). Les stacks de test suivent ces versions, et `core-api` passe à 2.1.0 ; le diff ne montre pas de route modifiée dans le contrat.
- CI et dépendances : `front-kit` est remplacé par `@mairie360/lib-components` 0.10.2 (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143)). CICD passe jusqu’à v4.4.1 avec un journal de release rédigé par Claude (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141), [#154](https://github.com/mairie360/Settings_Web_Service/pull/154)). Les workflows ne tournent plus en double sur les branches de PR, le token est en lecture seule par défaut, et `NODE_AUTH_TOKEN` passe en secret BuildKit (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129)).
- Renovate : `core-api` passe de 2.1.0 à 2.2.0 dans les stacks de test ([#158](https://github.com/mairie360/Settings_Web_Service/pull/158)).

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Promotion des déploiements : un push sur `main` ne lance plus que la release dev. Staging et prod se déclenchent à la main via `promote-staging.yml` et `promote-prod.yml` (`gh workflow run … [-f sha=<sha>]`), avec approbation de l’environnement. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150), [#151](https://github.com/mairie360/Settings_Web_Service/pull/151))

#### Technique
- CICD épinglé sur v4.4.0 puis v4.4.1 dans `cicd.yml`, `dev-dependency-exception.yml` et les deux `promote-*.yml`. Le test `cicd-pin.test.cjs` contrôle désormais les huit références ([#151](https://github.com/mairie360/Settings_Web_Service/pull/151), [#154](https://github.com/mairie360/Settings_Web_Service/pull/154), [#150](https://github.com/mairie360/Settings_Web_Service/pull/150)).
- Renovate : `core-api` passe de 2.1.0 à 2.2.0 dans les stacks de test ([#158](https://github.com/mairie360/Settings_Web_Service/pull/158)).

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Onglet Sécurité : lien **Gérer ma double authentification** vers le compte Keycloak de l’agent, affiché quand `KEYCLOAK_REALM_URL` est défini (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139)).

#### Changements de comportement
- La simulation SMS / application / codes de récupération disparaît de l’onglet Sécurité. Sans `KEYCLOAK_REALM_URL`, l’onglet affiche « La double authentification n’est pas disponible sur cette instance. » (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Nouvelle variable `KEYCLOAK_REALM_URL` : HTTPS uniquement, et le lien est masqué si elle est absente ou invalide (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139)).

#### Technique
- Contrat : `@mairie360/bff-settings-openapi` passe à `2.0.0` (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134)), puis au build dev `0.0.0-dev.bdc4a88…` (MAIR-575, [#145](https://github.com/mairie360/Settings_Web_Service/pull/145)). Le diff ne montre pas de route modifiée dans le contrat.
- Dépendances et CI : `front-kit` est remplacé par `@mairie360/lib-components` 0.10.2 (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143)). CICD passe à v4.3.2 avec un journal de release rédigé par Claude (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141)). Les workflows tournent sur les PR et sur push vers `main` seulement, le token est en lecture seule par défaut, et le Dockerfile de dev passe en Node 24.21.0 avec `NODE_AUTH_TOKEN` en secret BuildKit (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129)).

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
