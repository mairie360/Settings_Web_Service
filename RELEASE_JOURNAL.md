# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "cd677756a002e760d7b03618c5b66170dee00620", "prod": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod_tag": "v1.7.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-11-02 23:04 UTC", "prod": "2026-10-21 11:20 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.7.0 | `a2bf3c6` | 2026-10-21 11:20 UTC |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `cd67775` | 2026-11-02 23:04 UTC |

## Ajouté sur main depuis la dernière release prod (v1.7.0)

#### Changements de comportement
- Onglet Sécurité : la liste des sessions utilise désormais le `SessionList` de la lib (colonnes appareil, IP, création, expiration ou révocation, état), avec les mêmes états vide, chargement et indisponible que la console d'administration. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Action de révocation d'une session : elle ouvre une confirmation (`ConfirmModal` de la lib), et affiche un message d'attente tant que le port de révocation n'est pas branché. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Shell de l'application : la barre latérale, l'en-tête, le pied de page et la date viennent de `@mairie360/lib-components/shell` (`AccessibleShell`) ; les composants locaux correspondants sont supprimés. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Onglets, champs, boutons, en-tête de page et toasts viennent de la lib normalisée (onglets à identifiants stables `settings-tab-<clé>`) ; le style local des onglets est retiré, donc l'apparence des onglets et des titres change. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- `@mairie360/lib-components` passe de 0.10.2 à 1.0.3, un saut de version majeure. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Champ Téléphone du profil : l'aide commence par « Visible par tous les agents de la mairie (usage professionnel). », reliée au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))

#### Technique
- Sécurité des dépendances : zod 3.25.76 est remplacé par le backport vendorisé `3.25.76+mairie360.1` (GHSA-mrhx-c7xc-m3w5), avec une vérification d'intégrité hors ligne au `postinstall`, `prebuild` et `pretest` ; la preuve de bundle par source maps n'est émise que par la mesure CI. Le diff est tronqué, le détail est tiré de la description. (MAIR-770, [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- `follow-redirects` passe à 1.16.2 dans le lock (GHSA-mrwp-f3q8-3g9p), avec un test de politique. (sans ticket Jira, [#171](https://github.com/mairie360/Settings_Web_Service/pull/171))
- Pipeline : mairie360/CICD passe de v4.5.0 à v5.1.0 puis à v5.2.2 dans `cicd.yml`, `promote-*.yml`, `dev-dependency-exception.yml`, `gdpr-pr.yml` et le schéma de `rgaa.yaml`. (MAIR-771, [#177](https://github.com/mairie360/Settings_Web_Service/pull/177) ; MAIR-316, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92))
- Checklist RGPD : un workflow `gdpr-pr.yml` vérifie la section « Données personnelles » de chaque PR, avec des exécutions mises en file. (MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99))
- Node passe en 24.22.1 (Dockerfile, CI, documentation) avec un nouveau digest d'image de base ; Next.js est mis à jour selon la description, le diff tronqué ne permet pas de le détailler. (sans ticket Jira, [#164](https://github.com/mairie360/Settings_Web_Service/pull/164))
- Stack d'accessibilité RGAA : le périmètre et les états des pages par front, les données de test, le script `accessibility_test.sh`, la remise à zéro du rapport, le verrou de run, et les délais bornés des attentes (MAIR-316, MAIR-768, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92), [#169](https://github.com/mairie360/Settings_Web_Service/pull/169)). L'état de révocation de session est rejoué avec l'image `core-api:dev-7dfccfc` (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175)).
- Gitleaks, Semgrep et CICD : passage aux actions `security/semgrep-pypi` et `security/gitleaks-binary` ; `promote-prod.yml` reçoit `ANTHROPIC_WORKSPACE_ID` pour la pré-audit IA. (MAIR-316, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92))
- Dans la refonte MAIR-608, l'arborescence des composants passe à un dossier par composant (règle documentée dans `CLAUDE.md`, contrôlée par `tests/component-tree-convention.test.cjs`), et la couverture exclut les fichiers de test. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Documentation : `CLAUDE.md` et `README.md` ajoutent le lien vers la maquette Figma et la règle de ticket front. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Onglet Sécurité : la liste des sessions utilise désormais le `SessionList` de la lib (colonnes appareil, IP, création, expiration ou révocation, état), avec les mêmes états vide, chargement et indisponible que la console d'administration. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Action de révocation d'une session : elle ouvre une confirmation (`ConfirmModal` de la lib), et affiche un message d'attente tant que le port de révocation n'est pas branché. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Shell de l'application : la barre latérale, l'en-tête, le pied de page et la date viennent de `@mairie360/lib-components/shell` (`AccessibleShell`) ; les composants locaux correspondants sont supprimés. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Onglets, champs, boutons, en-tête de page et toasts viennent de la lib normalisée (onglets à identifiants stables `settings-tab-<clé>`) ; le style local des onglets est retiré, donc l'apparence des onglets et des titres change. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- `@mairie360/lib-components` passe de 0.10.2 à 1.0.3, un saut de version majeure. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Champ Téléphone du profil : l'aide commence par « Visible par tous les agents de la mairie (usage professionnel). », reliée au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))

#### Technique
- Sécurité des dépendances : zod 3.25.76 est remplacé par le backport vendorisé `3.25.76+mairie360.1` (GHSA-mrhx-c7xc-m3w5), avec une vérification d'intégrité hors ligne au `postinstall`, `prebuild` et `pretest` ; la preuve de bundle par source maps n'est émise que par la mesure CI. Le diff est tronqué, le détail est tiré de la description. (MAIR-770, [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- `follow-redirects` passe à 1.16.2 dans le lock (GHSA-mrwp-f3q8-3g9p), avec un test de politique. (sans ticket Jira, [#171](https://github.com/mairie360/Settings_Web_Service/pull/171))
- Pipeline : mairie360/CICD passe de v4.5.0 à v5.1.0 puis à v5.2.2 dans `cicd.yml`, `promote-*.yml`, `dev-dependency-exception.yml`, `gdpr-pr.yml` et le schéma de `rgaa.yaml`. (MAIR-771, [#177](https://github.com/mairie360/Settings_Web_Service/pull/177) ; MAIR-316, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92))
- Checklist RGPD : un workflow `gdpr-pr.yml` vérifie la section « Données personnelles » de chaque PR, avec des exécutions mises en file. (MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99))
- Node passe en 24.22.1 (Dockerfile, CI, documentation) avec un nouveau digest d'image de base ; Next.js est mis à jour selon la description, le diff tronqué ne permet pas de le détailler. (sans ticket Jira, [#164](https://github.com/mairie360/Settings_Web_Service/pull/164))
- Stack d'accessibilité RGAA : le périmètre et les états des pages par front, les données de test, le script `accessibility_test.sh`, la remise à zéro du rapport, le verrou de run, et les délais bornés des attentes (MAIR-316, MAIR-768, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92), [#169](https://github.com/mairie360/Settings_Web_Service/pull/169)). L'état de révocation de session est rejoué avec l'image `core-api:dev-7dfccfc` (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175)).
- Gitleaks, Semgrep et CICD : passage aux actions `security/semgrep-pypi` et `security/gitleaks-binary` ; `promote-prod.yml` reçoit `ANTHROPIC_WORKSPACE_ID` pour la pré-audit IA. (MAIR-316, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92))
- Dans la refonte MAIR-608, l'arborescence des composants passe à un dossier par composant (règle documentée dans `CLAUDE.md`, contrôlée par `tests/component-tree-convention.test.cjs`), et la couverture exclut les fichiers de test. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Documentation : `CLAUDE.md` et `README.md` ajoutent le lien vers la maquette Figma et la règle de ticket front. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-02 23:04 UTC | dev | — | `cd67775` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/41540186391) |
| 2026-11-02 22:55 UTC | dev | — | `21cd0a1` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/41539876958) |
| 2026-11-02 16:16 UTC | dev | — | `9ed8ea7` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/41478365348) |
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
