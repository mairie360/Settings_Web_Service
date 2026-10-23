# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "48d7ee23e663a797fe82f2f96ab0056902a23ed2", "prod": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod_tag": "v1.7.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-10-23 13:13 UTC", "prod": "2026-10-21 11:20 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.7.0 | `a2bf3c6` | 2026-10-21 11:20 UTC |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `48d7ee2` | 2026-10-23 13:13 UTC |

## Ajouté sur main depuis la dernière release prod (v1.7.0)

#### Changements de comportement
- Les onglets des Paramètres utilisent désormais le composant `Tabs` de la lib, avec des identifiants stables `settings-tab-<key>`. Les styles locaux des onglets sont supprimés, donc la barre d'onglets change d'apparence. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- L'en-tête de page (titre et description) est rendu par `PageHeader` de la lib ; la typographie locale du titre est retirée. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- La coque de l'application (barre latérale, barre supérieure, pied de page, date) vient de `@mairie360/lib-components/shell`. Les copies locales `accessible-shell`, `desktop-navigation`, `current-date` et `sidebar-preference` sont supprimées. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- L'onglet Sécurité affiche les sessions dans le `SessionList` de la lib, avec les colonnes appareil, IP, création, expiration ou révocation, et état, ainsi que les états chargement, vide et indisponible. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- La révocation d'une session demande désormais une confirmation (`ConfirmModal` de la lib). Une fois confirmée, elle appelle le port de fonctionnalité `revokeSession` ; tant que ce port n'est pas branché, un message « en attente » s'affiche. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Technique
- Mise à jour des correctifs de sécurité Node.js (24.22.1) dans le `Dockerfile`, `development.Dockerfile`, les workflows CI et les docs ; images `bookworm-slim` épinglées par digest. Next.js est monté à une version corrigée (GHSA-673q-mjm6-r5xr), dans le diff tronqué. Aucun effet visible hors runtime. (sans clé Jira, [#164](https://github.com/mairie360/Settings_Web_Service/pull/164))
- Dépendance `@mairie360/lib-components` passée de 0.10.2 à 1.0.3 (version majeure), ajout de `@types/jest-axe`, et nouvelle convention d'arborescence des composants vérifiée par `tests/component-tree-convention.test.cjs`. Couverture exclue des fichiers de test. Documentation Figma ajoutée. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Les onglets des Paramètres utilisent désormais le composant `Tabs` de la lib, avec des identifiants stables `settings-tab-<key>`. Les styles locaux des onglets sont supprimés, donc la barre d'onglets change d'apparence. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- L'en-tête de page (titre et description) est rendu par `PageHeader` de la lib ; la typographie locale du titre est retirée. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- La coque de l'application (barre latérale, barre supérieure, pied de page, date) vient de `@mairie360/lib-components/shell`. Les copies locales `accessible-shell`, `desktop-navigation`, `current-date` et `sidebar-preference` sont supprimées. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- L'onglet Sécurité affiche les sessions dans le `SessionList` de la lib, avec les colonnes appareil, IP, création, expiration ou révocation, et état, ainsi que les états chargement, vide et indisponible. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- La révocation d'une session demande désormais une confirmation (`ConfirmModal` de la lib). Une fois confirmée, elle appelle le port de fonctionnalité `revokeSession` ; tant que ce port n'est pas branché, un message « en attente » s'affiche. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Technique
- Mise à jour des correctifs de sécurité Node.js (24.22.1) dans le `Dockerfile`, `development.Dockerfile`, les workflows CI et les docs ; images `bookworm-slim` épinglées par digest. Next.js est monté à une version corrigée (GHSA-673q-mjm6-r5xr), dans le diff tronqué. Aucun effet visible hors runtime. (sans clé Jira, [#164](https://github.com/mairie360/Settings_Web_Service/pull/164))
- Dépendance `@mairie360/lib-components` passée de 0.10.2 à 1.0.3 (version majeure), ajout de `@types/jest-axe`, et nouvelle convention d'arborescence des composants vérifiée par `tests/component-tree-convention.test.cjs`. Couverture exclue des fichiers de test. Documentation Figma ajoutée. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-23 13:13 UTC | dev | — | `48d7ee2` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39958435256) |
| 2026-10-21 17:59 UTC | dev | — | `5d8598e` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39647798138) |
| 2026-10-21 11:20 UTC | prod | v1.7.0 | `a2bf3c6` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39591072177) |
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
