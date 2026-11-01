# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "afc63f787de79fef0bc2d793d311cc788127137f", "prod": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod_tag": "v1.7.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-10-23 13:17 UTC", "prod": "2026-10-21 11:20 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.7.0 | `a2bf3c6` | 2026-10-21 11:20 UTC |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `afc63f7` | 2026-10-23 13:17 UTC |

## Ajouté sur main depuis la dernière release prod (v1.7.0)

#### Changements de comportement

- Shell de l'application : la barre latérale, la barre supérieure, le pied de page et la date viennent désormais de `AccessibleShell` et `CurrentDate` de `@mairie360/lib-components/shell`. Les composants locaux `desktop-navigation`, `accessible-shell`, `current-date` et `sidebar-preference` sont supprimés. (MAIR-578 et MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Onglets de Réglages : les styles locaux (grille 2, 3 ou 6 colonnes, onglet sélectionné) sont retirés au profit du composant `Tabs` de la lib, dont les identifiants deviennent `settings-tab-<key>`. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Onglet Sécurité : la liste des sessions est le `SessionList` de la lib (appareil, IP, création, expiration ou révocation, état, avec états de chargement, vide et indisponible). La révocation passe par une confirmation `ConfirmModal` ; sans port de révocation branché, un message d'attente s'affiche. (MAIR-607, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Champs, boutons, toasts, pastilles de statut et titres rendus par la lib normalisée : tailles et charte modifiées à l'écran. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Technique

- Pipeline CICD passé en v4.5.0 dans `cicd.yml`, `dev-dependency-exception.yml`, `promote-prod.yml` et `promote-staging.yml` (commit `fe5229c`). ([#163](https://github.com/mairie360/Settings_Web_Service/pull/163))
- Node 24.21.0 → 24.22.1 (workflows, `Dockerfile`, `development.Dockerfile`, `package.json`), images `bookworm-slim` épinglées par nouveau digest, Next.js mis à jour vers le correctif GHSA-673q-mjm6-r5xr, lockfiles synchronisés. ([#164](https://github.com/mairie360/Settings_Web_Service/pull/164))
- `@mairie360/lib-components` passe de 0.10.2 à 1.0.3 (version majeure), ajout de `@types/jest-axe`. La PR annonce un passage en brouillon jusqu'à la publication de la lib, mais le diff contient déjà ce pin. ([#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Arborescence de `src/components` réorganisée en dossiers par composant sous `SettingsPage/`, tests co-localisés, contrôle par `tests/component-tree-convention.test.cjs`, couverture qui exclut les fichiers de test. ([#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Diffs de #164 et #156 tronqués : seuls les fichiers visibles ont été analysés.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement

- Shell de l'application : la barre latérale, la barre supérieure, le pied de page et la date viennent désormais de `AccessibleShell` et `CurrentDate` de `@mairie360/lib-components/shell`. Les composants locaux `desktop-navigation`, `accessible-shell`, `current-date` et `sidebar-preference` sont supprimés. (MAIR-578 et MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Onglets de Réglages : les styles locaux (grille 2, 3 ou 6 colonnes, onglet sélectionné) sont retirés au profit du composant `Tabs` de la lib, dont les identifiants deviennent `settings-tab-<key>`. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Onglet Sécurité : la liste des sessions est le `SessionList` de la lib (appareil, IP, création, expiration ou révocation, état, avec états de chargement, vide et indisponible). La révocation passe par une confirmation `ConfirmModal` ; sans port de révocation branché, un message d'attente s'affiche. (MAIR-607, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Champs, boutons, toasts, pastilles de statut et titres rendus par la lib normalisée : tailles et charte modifiées à l'écran. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Technique

- Pipeline CICD passé en v4.5.0 dans `cicd.yml`, `dev-dependency-exception.yml`, `promote-prod.yml` et `promote-staging.yml` (commit `fe5229c`). ([#163](https://github.com/mairie360/Settings_Web_Service/pull/163))
- Node 24.21.0 → 24.22.1 (workflows, `Dockerfile`, `development.Dockerfile`, `package.json`), images `bookworm-slim` épinglées par nouveau digest, Next.js mis à jour vers le correctif GHSA-673q-mjm6-r5xr, lockfiles synchronisés. ([#164](https://github.com/mairie360/Settings_Web_Service/pull/164))
- `@mairie360/lib-components` passe de 0.10.2 à 1.0.3 (version majeure), ajout de `@types/jest-axe`. La PR annonce un passage en brouillon jusqu'à la publication de la lib, mais le diff contient déjà ce pin. ([#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Arborescence de `src/components` réorganisée en dossiers par composant sous `SettingsPage/`, tests co-localisés, contrôle par `tests/component-tree-convention.test.cjs`, couverture qui exclut les fichiers de test. ([#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Diffs de #164 et #156 tronqués : seuls les fichiers visibles ont été analysés.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-23 13:17 UTC | dev | — | `afc63f7` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/39958866694) |
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
