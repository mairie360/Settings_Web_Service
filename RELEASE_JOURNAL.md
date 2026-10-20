# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "dbc6d6c659cac0939c83a04fe30c33546dbf6a60", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "3e6410991fb271011a2248fa3ba17c778250bc3b", "updated": {"dev": "2026-10-20 12:24 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `3e64109` | — |
| dev | — | `dbc6d6c` | 2026-10-20 12:24 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Changements de comportement
- Onglet Sécurité : la section simulée « Authentification à deux facteurs » disparaît. Elle proposait le choix SMS ou application, un faux défi, des codes de récupération et la désactivation. Elle est remplacée par « Double authentification » :
  - si l'instance configure `KEYCLOAK_REALM_URL`, une courte explication et un lien **Gérer ma double authentification** ouvrent `<realm>/account` dans le même onglet. L'agent y ajoute, remplace ou supprime une application d'authentification ou une clé de sécurité.
  - sinon, le message « La double authentification n’est pas disponible sur cette instance. » s'affiche.
  - aucun SMS ni état activé/désactivé n'est affiché. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Nouvelle variable `KEYCLOAK_REALM_URL`, lue côté serveur. Elle est acceptée seulement en HTTPS (HTTP pour un hôte local), avec un chemin `…/realms/<realm>` et sans identifiants, requête ni fragment. Absente ou invalide, le lien est masqué. Les membres MFA de `SettingsFeaturePort` sont retirés. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Dépendances :
  - le contrat `@mairie360/bff-settings-openapi` passe de `0.0.0-dev.6d72619…` à la version prod `2.0.0` ;
  - les stacks `docker-compose*.yml` passent aux images `bff-settings:2.0.0`, `core-api:2.1.0`, `database:3.2.0` et `liquibase-migrations:3.2.0`. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
  - le socle partagé (session, garde du proxy, CSP, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components@0.10.2`. L'archive `@mairie360/front-kit` est supprimée, sans changement de comportement. Un test `npm run test:bundle` vérifie qu'aucune entrée de lib inutilisée ni code serveur n'arrive dans le bundle client. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- CI/CD et images :
  - jeton de workflow en lecture seule par défaut, avec droits d'écriture réservés au job `CICD` ;
  - pipelines sur push limités à `main` ;
  - `development.Dockerfile` passe en Node 24.21.0 épinglé par digest. Le token npm est passé en secret BuildKit (et non plus en build arg) dans `docker-compose.yml`, ce qui répare `docker compose up --build`. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
  - `mairie360/CICD` passe en v4.3.1 puis v4.3.2, épinglé par SHA avec commentaire de tag suivi par Renovate. Ajout des secrets du journal des releases et d'un test `tests/cicd-pin.test.cjs`. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Onglet Sécurité : la section simulée « Authentification à deux facteurs » disparaît. Elle proposait le choix SMS ou application, un faux défi, des codes de récupération et la désactivation. Elle est remplacée par « Double authentification » :
  - si l'instance configure `KEYCLOAK_REALM_URL`, une courte explication et un lien **Gérer ma double authentification** ouvrent `<realm>/account` dans le même onglet. L'agent y ajoute, remplace ou supprime une application d'authentification ou une clé de sécurité.
  - sinon, le message « La double authentification n’est pas disponible sur cette instance. » s'affiche.
  - aucun SMS ni état activé/désactivé n'est affiché. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Nouvelle variable `KEYCLOAK_REALM_URL`, lue côté serveur. Elle est acceptée seulement en HTTPS (HTTP pour un hôte local), avec un chemin `…/realms/<realm>` et sans identifiants, requête ni fragment. Absente ou invalide, le lien est masqué. Les membres MFA de `SettingsFeaturePort` sont retirés. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Dépendances :
  - le contrat `@mairie360/bff-settings-openapi` passe de `0.0.0-dev.6d72619…` à la version prod `2.0.0` ;
  - les stacks `docker-compose*.yml` passent aux images `bff-settings:2.0.0`, `core-api:2.1.0`, `database:3.2.0` et `liquibase-migrations:3.2.0`. (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
  - le socle partagé (session, garde du proxy, CSP, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components@0.10.2`. L'archive `@mairie360/front-kit` est supprimée, sans changement de comportement. Un test `npm run test:bundle` vérifie qu'aucune entrée de lib inutilisée ni code serveur n'arrive dans le bundle client. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- CI/CD et images :
  - jeton de workflow en lecture seule par défaut, avec droits d'écriture réservés au job `CICD` ;
  - pipelines sur push limités à `main` ;
  - `development.Dockerfile` passe en Node 24.21.0 épinglé par digest. Le token npm est passé en secret BuildKit (et non plus en build arg) dans `docker-compose.yml`, ce qui répare `docker compose up --build`. (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
  - `mairie360/CICD` passe en v4.3.1 puis v4.3.2, épinglé par SHA avec commentaire de tag suivi par Renovate. Ajout des secrets du journal des releases et d'un test `tests/cicd-pin.test.cjs`. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 12:24 UTC | dev | — | `dbc6d6c` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39421349929) |
| 2026-10-19 22:29 UTC | dev | — | `c1adb82` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39334721734) |
| 2026-10-19 22:15 UTC | dev | — | `88d755d` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39333039530) |
| 2026-10-19 22:02 UTC | dev | — | `a3c7005` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39331022273) |
| 2026-10-19 20:09 UTC | dev | — | `1304b75` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39316027226) |
<!-- release-journal-history:end -->
