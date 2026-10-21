# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "5d8598e2f3b78c4d58653ce0ab38df2c0b110b4d", "prod": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod_tag": "v1.7.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-10-21 17:59 UTC", "prod": "2026-10-21 11:20 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.7.0 | `a2bf3c6` | 2026-10-21 11:20 UTC |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `5d8598e` | 2026-10-21 17:59 UTC |

## Ajouté sur main depuis la dernière release prod (v1.7.0)

#### Changements de comportement
- Les onglets des Réglages utilisent désormais le composant `Tabs` de la lib (ids stables `settings-tab-<key>`, panneau géré par l'hôte). L'apparence et la mise en page des onglets changent, et les sélecteurs CSS qui ciblaient les anciennes classes `.settings-tab` ne correspondent plus. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- L'onglet Sécurité affiche les sessions avec le `SessionList` de la lib, qui gère les états de chargement, vide et indisponible. L'action de révocation ouvre une confirmation (`ConfirmModal` de la lib) ; si le port `revokeSession` n'est pas branché, un message d'attente s'affiche à la place de la révocation. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- La coque de l'application (barre latérale, barre du haut, pied de page) vient de `AccessibleShell` de la lib, et la date de la page passe par le `PageHeader` de la lib. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Les champs de formulaire (`TextField`, `PasswordField`, `SelectField`, `TextArea`, `Checkbox`, `RadioGroup`, `Slider`), les boutons, les `StatusPill` et les notifications `Toast` (le ton selon le message) viennent de la lib. L'apparence des écrans change donc pour les agents. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
#### Technique
- Mise à jour de `@mairie360/lib-components` de 0.10.2 à 1.0.3 (version majeure, commit marqué breaking) et ajout de `@types/jest-axe` en dev. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Réorganisation des composants de réglages en un dossier par composant sous `src/components/SettingsPage/`, avec tests co-localisés et contrôle par `tests/component-tree-convention.test.cjs`. Les anciens fichiers `settings-*.tsx`, `accessible-shell.tsx`, `desktop-navigation.tsx`, `current-date.tsx` et `sidebar-preference.ts` sont supprimés. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Ajout de tests de contrôle de l'adoption de la lib et des fixtures de releases partagées, exclusion des fichiers de test de la couverture des sources, et documentation Figma dans `README.md` et `CLAUDE.md`. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Les onglets des Réglages utilisent désormais le composant `Tabs` de la lib (ids stables `settings-tab-<key>`, panneau géré par l'hôte). L'apparence et la mise en page des onglets changent, et les sélecteurs CSS qui ciblaient les anciennes classes `.settings-tab` ne correspondent plus. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- L'onglet Sécurité affiche les sessions avec le `SessionList` de la lib, qui gère les états de chargement, vide et indisponible. L'action de révocation ouvre une confirmation (`ConfirmModal` de la lib) ; si le port `revokeSession` n'est pas branché, un message d'attente s'affiche à la place de la révocation. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- La coque de l'application (barre latérale, barre du haut, pied de page) vient de `AccessibleShell` de la lib, et la date de la page passe par le `PageHeader` de la lib. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Les champs de formulaire (`TextField`, `PasswordField`, `SelectField`, `TextArea`, `Checkbox`, `RadioGroup`, `Slider`), les boutons, les `StatusPill` et les notifications `Toast` (le ton selon le message) viennent de la lib. L'apparence des écrans change donc pour les agents. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
#### Technique
- Mise à jour de `@mairie360/lib-components` de 0.10.2 à 1.0.3 (version majeure, commit marqué breaking) et ajout de `@types/jest-axe` en dev. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Réorganisation des composants de réglages en un dossier par composant sous `src/components/SettingsPage/`, avec tests co-localisés et contrôle par `tests/component-tree-convention.test.cjs`. Les anciens fichiers `settings-*.tsx`, `accessible-shell.tsx`, `desktop-navigation.tsx`, `current-date.tsx` et `sidebar-preference.ts` sont supprimés. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Ajout de tests de contrôle de l'adoption de la lib et des fixtures de releases partagées, exclusion des fichiers de test de la couverture des sources, et documentation Figma dans `README.md` et `CLAUDE.md`. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
