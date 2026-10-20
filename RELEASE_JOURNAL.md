# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "891e2fad0cf68e2078376437df51d542d2223490", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "891e2fad0cf68e2078376437df51d542d2223490", "updated": {"dev": "2026-10-20 13:12 UTC", "staging": "2026-10-20 18:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `891e2fa` | 2026-10-20 18:18 UTC |
| dev | — | `891e2fa` | 2026-10-20 13:12 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés
- Onglet Sécurité : nouvelle section « Double authentification ». Quand `KEYCLOAK_REALM_URL` est configurée, un lien **Gérer ma double authentification** ouvre dans le même onglet la console du compte Keycloak de l’agent (`<realm>/account`). L’agent y ajoute, remplace ou supprime une application d’authentification ou une clé de sécurité. Sans cette variable, ou si elle est invalide, le lien est masqué et l’onglet affiche « La double authentification n’est pas disponible sur cette instance. » L’URL n’est acceptée qu’en HTTPS (HTTP pour un hôte local), avec un chemin `…/realms/<realm>` et sans identifiants, requête ni fragment. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- L’ancienne section simulée « Authentification à deux facteurs » disparaît de l’onglet Sécurité : choix SMS ou application, faux défi, codes de récupération et désactivation. Settings n’affiche plus d’état activé ou désactivé du second facteur. Les membres MFA de `SettingsFeaturePort` sont retirés. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Dépendances, sans changement de comportement annoncé :
  - `@mairie360/front-kit` (archive dans `vendor/`) est remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2.
  - `@mairie360/bff-settings-openapi` passe de `0.0.0-dev.6d72619…` à 2.0.0, puis au build dev `0.0.0-dev.bdc4a888d2065a9663a3c09e69c05bcf3c373090`.
  - Les stacks `docker-compose*.yml` utilisent `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0 et `bff-settings:dev-bdc4a88`.
  - (MAIR-126, MAIR-569, MAIR-575, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#134](https://github.com/mairie360/Settings_Web_Service/pull/134), [#145](https://github.com/mairie360/Settings_Web_Service/pull/145))
- CI/CD et tests :
  - Le workflow `mairie360/CICD` passe en v4.3.1 puis v4.3.2 : journal des releases, épinglage SHA suivi par Renovate.
  - Le jeton CI est en lecture seule par défaut et les workflows ne se lancent sur push que pour `main`.
  - `development.Dockerfile` passe en Node 24.21.0 avec le secret BuildKit `node_auth_token` ; `docker compose up --build` fonctionne à nouveau.
  - Un test vérifie le contenu du bundle client.
  - (MAIR-571, MAIR-436, MAIR-126, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141), [#129](https://github.com/mairie360/Settings_Web_Service/pull/129), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Onglet Sécurité : nouvelle section « Double authentification ». Quand `KEYCLOAK_REALM_URL` est configurée, un lien **Gérer ma double authentification** ouvre dans le même onglet la console du compte Keycloak de l’agent (`<realm>/account`). L’agent y ajoute, remplace ou supprime une application d’authentification ou une clé de sécurité. Sans cette variable, ou si elle est invalide, le lien est masqué et l’onglet affiche « La double authentification n’est pas disponible sur cette instance. » L’URL n’est acceptée qu’en HTTPS (HTTP pour un hôte local), avec un chemin `…/realms/<realm>` et sans identifiants, requête ni fragment. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- L’ancienne section simulée « Authentification à deux facteurs » disparaît de l’onglet Sécurité : choix SMS ou application, faux défi, codes de récupération et désactivation. Settings n’affiche plus d’état activé ou désactivé du second facteur. Les membres MFA de `SettingsFeaturePort` sont retirés. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Dépendances, sans changement de comportement annoncé :
  - `@mairie360/front-kit` (archive dans `vendor/`) est remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2.
  - `@mairie360/bff-settings-openapi` passe de `0.0.0-dev.6d72619…` à 2.0.0, puis au build dev `0.0.0-dev.bdc4a888d2065a9663a3c09e69c05bcf3c373090`.
  - Les stacks `docker-compose*.yml` utilisent `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0 et `bff-settings:dev-bdc4a88`.
  - (MAIR-126, MAIR-569, MAIR-575, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#134](https://github.com/mairie360/Settings_Web_Service/pull/134), [#145](https://github.com/mairie360/Settings_Web_Service/pull/145))
- CI/CD et tests :
  - Le workflow `mairie360/CICD` passe en v4.3.1 puis v4.3.2 : journal des releases, épinglage SHA suivi par Renovate.
  - Le jeton CI est en lecture seule par défaut et les workflows ne se lancent sur push que pour `main`.
  - `development.Dockerfile` passe en Node 24.21.0 avec le secret BuildKit `node_auth_token` ; `docker compose up --build` fonctionne à nouveau.
  - Un test vérifie le contenu du bundle client.
  - (MAIR-571, MAIR-436, MAIR-126, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141), [#129](https://github.com/mairie360/Settings_Web_Service/pull/129), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 18:18 UTC | staging | — | `891e2fa` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39427485154) |
| 2026-10-20 13:12 UTC | dev | — | `891e2fa` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39427485154) |
| 2026-10-20 12:24 UTC | dev | — | `dbc6d6c` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39421349929) |
| 2026-10-19 22:29 UTC | dev | — | `c1adb82` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39334721734) |
| 2026-10-19 22:15 UTC | dev | — | `88d755d` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39333039530) |
| 2026-10-19 22:02 UTC | dev | — | `a3c7005` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39331022273) |
| 2026-10-19 20:09 UTC | dev | — | `1304b75` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39316027226) |
<!-- release-journal-history:end -->
