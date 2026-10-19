# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "c1adb824e18ca58c6cbd766db99957346191fce9", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "3e6410991fb271011a2248fa3ba17c778250bc3b", "updated": {"dev": "2026-10-19 22:29 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `3e64109` | — |
| dev | — | `c1adb82` | 2026-10-19 22:29 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés
- Onglet Sécurité : une section « Double authentification » propose le lien **Gérer ma double authentification**. Il ouvre la console de compte Keycloak de l'agent (`<realm>/account`) dans le même onglet pour gérer le second facteur. Le lien dépend de la nouvelle variable `KEYCLOAK_REALM_URL`, lue côté serveur. Elle doit être en HTTPS (HTTP admis pour un hôte local en développement), avec un chemin `…/realms/<realm>`, sans identifiants, requête ni fragment. Si la variable est absente ou invalide, le lien est masqué et l'onglet affiche « La double authentification n’est pas disponible sur cette instance. » (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- La simulation « Authentification à deux facteurs » de l'onglet Sécurité est supprimée : choix SMS / application, faux défi d'activation, codes de récupération et désactivation. Settings ne propose plus le SMS et n'affiche aucun état activé/désactivé. Les membres MFA de `SettingsFeaturePort` sont retirés. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Dépendances, sans changement de comportement annoncé :
  - Le contrat `@mairie360/bff-settings-openapi` passe de `0.0.0-dev.6d726190…` à `2.0.0`.
  - Les images des stacks `docker-compose*.yml` passent aux releases prod : `bff-settings:2.0.0`, `core-api:2.1.0`, `database:3.2.0`, `liquibase-migrations:3.2.0`.
  - Le socle partagé `@mairie360/front-kit` (archive dans `vendor/`) est remplacé par les sous-chemins de `@mairie360/lib-components` `0.10.2`.
  - (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134) ; MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138))
- CI et outillage :
  - Le jeton de workflow est en lecture seule par défaut, et le pipeline ne tourne sur `push` que pour `main`.
  - L'image de dev passe en Node 24.21.0 épinglé, et la stack locale reçoit le token npm en secret BuildKit, ce qui corrige `docker compose up --build`.
  - Le CICD passe en v4.3.1, avec l'étape de journal de release.
  - Un test vérifie que le bundle client n'embarque pas d'entrée inutilisée de la lib.
  - (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129) ; MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136) ; MAIR-126, [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Onglet Sécurité : une section « Double authentification » propose le lien **Gérer ma double authentification**. Il ouvre la console de compte Keycloak de l'agent (`<realm>/account`) dans le même onglet pour gérer le second facteur. Le lien dépend de la nouvelle variable `KEYCLOAK_REALM_URL`, lue côté serveur. Elle doit être en HTTPS (HTTP admis pour un hôte local en développement), avec un chemin `…/realms/<realm>`, sans identifiants, requête ni fragment. Si la variable est absente ou invalide, le lien est masqué et l'onglet affiche « La double authentification n’est pas disponible sur cette instance. » (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- La simulation « Authentification à deux facteurs » de l'onglet Sécurité est supprimée : choix SMS / application, faux défi d'activation, codes de récupération et désactivation. Settings ne propose plus le SMS et n'affiche aucun état activé/désactivé. Les membres MFA de `SettingsFeaturePort` sont retirés. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Dépendances, sans changement de comportement annoncé :
  - Le contrat `@mairie360/bff-settings-openapi` passe de `0.0.0-dev.6d726190…` à `2.0.0`.
  - Les images des stacks `docker-compose*.yml` passent aux releases prod : `bff-settings:2.0.0`, `core-api:2.1.0`, `database:3.2.0`, `liquibase-migrations:3.2.0`.
  - Le socle partagé `@mairie360/front-kit` (archive dans `vendor/`) est remplacé par les sous-chemins de `@mairie360/lib-components` `0.10.2`.
  - (MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134) ; MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138))
- CI et outillage :
  - Le jeton de workflow est en lecture seule par défaut, et le pipeline ne tourne sur `push` que pour `main`.
  - L'image de dev passe en Node 24.21.0 épinglé, et la stack locale reçoit le token npm en secret BuildKit, ce qui corrige `docker compose up --build`.
  - Le CICD passe en v4.3.1, avec l'étape de journal de release.
  - Un test vérifie que le bundle client n'embarque pas d'entrée inutilisée de la lib.
  - (MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129) ; MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136) ; MAIR-126, [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 22:29 UTC | dev | — | `c1adb82` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39334721734) |
| 2026-10-19 22:15 UTC | dev | — | `88d755d` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39333039530) |
| 2026-10-19 22:02 UTC | dev | — | `a3c7005` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39331022273) |
| 2026-10-19 20:09 UTC | dev | — | `1304b75` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39316027226) |
<!-- release-journal-history:end -->
