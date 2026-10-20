# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "891e2fad0cf68e2078376437df51d542d2223490", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "3e6410991fb271011a2248fa3ba17c778250bc3b", "updated": {"dev": "2026-10-20 13:12 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `3e64109` | — |
| dev | — | `891e2fa` | 2026-10-20 13:12 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés
- Onglet Sécurité : une section « Double authentification » propose le lien **Gérer ma double authentification**. Il ouvre la console du compte Keycloak de l’agent (`<realm>/account`, dans le même onglet), où l’agent gère son second facteur. Le lien n’apparaît que si la variable `KEYCLOAK_REALM_URL` est définie et valide : HTTPS uniquement (HTTP accepté pour un hôte local en développement), chemin `…/realms/<realm>`, sans identifiants, requête ni fragment. Sinon, l’onglet affiche « La double authentification n’est pas disponible sur cette instance. ». (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- L’ancienne « Authentification à deux facteurs » simulée de l’onglet Sécurité est retirée : choix SMS / application, faux défi d’activation, codes de récupération et désactivation. Settings n’affiche plus d’état activé/désactivé du second facteur. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Dépendances, sans changement de comportement :
  - Le socle partagé est désormais importé depuis les sous-chemins de `@mairie360/lib-components` 0.10.2, à la place de l’archive `@mairie360/front-kit`. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138))
  - Le contrat `@mairie360/bff-settings-openapi` est passé à 2.0.0, puis à `0.0.0-dev.bdc4a888d2065a9663a3c09e69c05bcf3c373090`. Les images des stacks de test `docker-compose*.yml` suivent (MAIR-569, MAIR-575, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134), [#145](https://github.com/mairie360/Settings_Web_Service/pull/145)).
- CI et outillage, 4 PR :
  - CICD épinglé en v4.3.1 puis en v4.3.2, avec le journal des releases et le suivi Renovate des pins.
  - Jeton CI en lecture seule par défaut et pipeline sur `push` limité à `main`.
  - Image de développement en Node 24.21.0 et jeton passé en secret BuildKit dans `docker-compose.yml`.
  - Test du bundle client renforcé.
  (MAIR-571, MAIR-436, MAIR-126, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141), [#129](https://github.com/mairie360/Settings_Web_Service/pull/129), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Onglet Sécurité : une section « Double authentification » propose le lien **Gérer ma double authentification**. Il ouvre la console du compte Keycloak de l’agent (`<realm>/account`, dans le même onglet), où l’agent gère son second facteur. Le lien n’apparaît que si la variable `KEYCLOAK_REALM_URL` est définie et valide : HTTPS uniquement (HTTP accepté pour un hôte local en développement), chemin `…/realms/<realm>`, sans identifiants, requête ni fragment. Sinon, l’onglet affiche « La double authentification n’est pas disponible sur cette instance. ». (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- L’ancienne « Authentification à deux facteurs » simulée de l’onglet Sécurité est retirée : choix SMS / application, faux défi d’activation, codes de récupération et désactivation. Settings n’affiche plus d’état activé/désactivé du second facteur. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Dépendances, sans changement de comportement :
  - Le socle partagé est désormais importé depuis les sous-chemins de `@mairie360/lib-components` 0.10.2, à la place de l’archive `@mairie360/front-kit`. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138))
  - Le contrat `@mairie360/bff-settings-openapi` est passé à 2.0.0, puis à `0.0.0-dev.bdc4a888d2065a9663a3c09e69c05bcf3c373090`. Les images des stacks de test `docker-compose*.yml` suivent (MAIR-569, MAIR-575, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134), [#145](https://github.com/mairie360/Settings_Web_Service/pull/145)).
- CI et outillage, 4 PR :
  - CICD épinglé en v4.3.1 puis en v4.3.2, avec le journal des releases et le suivi Renovate des pins.
  - Jeton CI en lecture seule par défaut et pipeline sur `push` limité à `main`.
  - Image de développement en Node 24.21.0 et jeton passé en secret BuildKit dans `docker-compose.yml`.
  - Test du bundle client renforcé.
  (MAIR-571, MAIR-436, MAIR-126, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141), [#129](https://github.com/mairie360/Settings_Web_Service/pull/129), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 13:12 UTC | dev | — | `891e2fa` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39427485154) |
| 2026-10-20 12:24 UTC | dev | — | `dbc6d6c` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39421349929) |
| 2026-10-19 22:29 UTC | dev | — | `c1adb82` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39334721734) |
| 2026-10-19 22:15 UTC | dev | — | `88d755d` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39333039530) |
| 2026-10-19 22:02 UTC | dev | — | `a3c7005` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39331022273) |
| 2026-10-19 20:09 UTC | dev | — | `1304b75` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39316027226) |
<!-- release-journal-history:end -->
