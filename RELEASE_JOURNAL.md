# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod": "3e6410991fb271011a2248fa3ba17c778250bc3b", "prod_tag": "v1.6.0", "staging": "891e2fad0cf68e2078376437df51d542d2223490", "updated": {"dev": "2026-10-21 11:13 UTC", "staging": "2026-10-20 18:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `3e64109` | — |
| staging | — | `891e2fa` | 2026-10-20 18:18 UTC |
| dev | — | `a2bf3c6` | 2026-10-21 11:13 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés
- Onglet Sécurité : un lien « Gérer ma double authentification » ouvre le compte Keycloak de l’agent (`<realm>/account`, même onglet) lorsque `KEYCLOAK_REALM_URL` est configurée. Sans cette variable, le message « La double authentification n’est pas disponible sur cette instance. » s’affiche. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- La simulation de double authentification de l’onglet Sécurité (choix SMS / application, défi factice, codes de récupération, désactivation) est retirée ; aucun état activé/désactivé n’est affiché et les membres MFA de `SettingsFeaturePort` sont supprimés. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Nouvelle variable d’environnement `KEYCLOAK_REALM_URL` (URL publique HTTPS du realm, lue côté serveur) ; absente ou invalide, le lien est masqué. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Socle frontend : `@mairie360/front-kit` (archive vendored) remplacé par `@mairie360/lib-components` 0.10.2 via ses sous-chemins, sans changement de comportement ; archive `vendor/` supprimée et test de bundle client ajouté. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- Contrat et images de test : `@mairie360/bff-settings-openapi` passe à 2.1.0 (étapes intermédiaires en 2.0.0 puis dev), images bff-settings 2.1.0, database et liquibase-migrations 3.3.0, core-api 2.2.0. (MAIR-612, [#160](https://github.com/mairie360/Settings_Web_Service/pull/160), [#159](https://github.com/mairie360/Settings_Web_Service/pull/159), [#158](https://github.com/mairie360/Settings_Web_Service/pull/158), [#134](https://github.com/mairie360/Settings_Web_Service/pull/134))
- CI : mairie360/CICD porté jusqu’à v4.4.3, workflows promote-staging et promote-prod manuels, push sur `main` seulement, permissions de token en lecture seule, secrets du journal de release, et `NODE_AUTH_TOKEN` passé en secret BuildKit à l’image de dev. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150), [#157](https://github.com/mairie360/Settings_Web_Service/pull/157), [#154](https://github.com/mairie360/Settings_Web_Service/pull/154), [#151](https://github.com/mairie360/Settings_Web_Service/pull/151), [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141), [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
- Tests : `tests/cicd-pin.test.cjs`, `tests/workflow-permissions.test.cjs` et `tests/dev-image-secret.test.cjs` ajoutés ; tests de politique CI mis à jour.

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Contrat : `@mairie360/bff-settings-openapi` épinglé à 2.1.0 (remplace le build dev `0.0.0-dev.bdc4a88`) et image bff-settings des stacks de test en 2.1.0. (MAIR-612, [#160](https://github.com/mairie360/Settings_Web_Service/pull/160))
- Images des stacks de test : database et liquibase-migrations en 3.3.0, core-api en 2.2.0. (MAIR-612 et Renovate, [#159](https://github.com/mairie360/Settings_Web_Service/pull/159), [#158](https://github.com/mairie360/Settings_Web_Service/pull/158))
- CI : mairie360/CICD v4.4.0 puis v4.4.3 ; un push sur `main` s’arrête à `release-dev`, et staging et prod se promeuvent à la main via les workflows promote-staging et promote-prod. (MAIR-494, [#150](https://github.com/mairie360/Settings_Web_Service/pull/150), [#151](https://github.com/mairie360/Settings_Web_Service/pull/151), [#154](https://github.com/mairie360/Settings_Web_Service/pull/154), [#157](https://github.com/mairie360/Settings_Web_Service/pull/157))
- Tests : `tests/cicd-pin.test.cjs` couvre désormais les quatre références CICD.

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Onglet Sécurité : un lien « Gérer ma double authentification » ouvre le compte Keycloak de l’agent (`<realm>/account`, même onglet) lorsque `KEYCLOAK_REALM_URL` est configurée. Sans cette variable, le message « La double authentification n’est pas disponible sur cette instance. » s’affiche. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Changements de comportement
- La simulation de double authentification de l’onglet Sécurité (choix SMS / application, défi factice, codes de récupération, désactivation) est retirée ; aucun état activé/désactivé n’est affiché. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))
- Nouvelle variable d’environnement `KEYCLOAK_REALM_URL` (URL publique HTTPS du realm, lue côté serveur) ; absente ou invalide, le lien est masqué. (MAIR-357, [#139](https://github.com/mairie360/Settings_Web_Service/pull/139))

#### Technique
- Socle frontend : `@mairie360/front-kit` remplacé par `@mairie360/lib-components` 0.10.2 via ses sous-chemins, sans changement de comportement ; archive `vendor/` supprimée et test de bundle client ajouté. (MAIR-126, [#138](https://github.com/mairie360/Settings_Web_Service/pull/138), [#143](https://github.com/mairie360/Settings_Web_Service/pull/143))
- Contrat : `@mairie360/bff-settings-openapi` passe du build dev à 2.0.0 (MAIR-575, [#145](https://github.com/mairie360/Settings_Web_Service/pull/145), MAIR-569, [#134](https://github.com/mairie360/Settings_Web_Service/pull/134)), avec images de test database, liquibase et core-api alignées sur leurs releases prod.
- CI : mairie360/CICD porté à v4.3.2 puis v4.3.1 ; le journal de release (secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`) est branché sur le workflow ; permissions de token en lecture seule et workflows déclenchés sur `main` seulement ; `NODE_AUTH_TOKEN` passé en secret BuildKit à l’image de dev, et image Node 24.21.0 épinglée par digest. (MAIR-571, [#136](https://github.com/mairie360/Settings_Web_Service/pull/136), [#141](https://github.com/mairie360/Settings_Web_Service/pull/141), MAIR-436, [#129](https://github.com/mairie360/Settings_Web_Service/pull/129))
- Tests : `tests/workflow-permissions.test.cjs`, `tests/dev-image-secret.test.cjs` et `tests/cicd-pin.test.cjs` ajoutés ; tests de politique CI mis à jour.

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
