# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "069c282005368531a5a353848b4d6f6e53906406", "prod": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod_tag": "v1.7.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-11-04 18:36 UTC", "prod": "2026-10-21 11:20 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.7.0 | `a2bf3c6` | 2026-10-21 11:20 UTC |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `069c282` | 2026-11-04 18:36 UTC |

## Ajouté sur main depuis la dernière release prod (v1.7.0)

#### Nouveautés
- Le champ téléphone du profil affiche d'abord la phrase « Visible par tous les agents de la mairie (usage professionnel). », reliée au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))

#### Changements de comportement
- L'onglet Sécurité affiche les sessions avec le `SessionList` de la lib (appareil, IP, création, expiration ou révocation, état), avec ses états chargement, vide et indisponible. L'action de ligne ouvre une confirmation `ConfirmModal` ; si le port de révocation n'est pas branché, un message en attente s'affiche. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Les onglets et l'en-tête des réglages changent : les styles locaux des onglets sont retirés, les onglets utilisent le composant `Tabs` de la lib avec des ids stables `settings-tab-<key>`, et le titre passe par `PageHeader`. La mise en page en grille par largeur d'écran disparaît. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Le shell (barre latérale, en-tête, pied de page, date de la page) vient de la lib ; les composants locaux correspondants sont supprimés. (MAIR-578, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Corrections
- Sessions : avant, Core renvoyait les dates au format « 2026-01-14 07:30:00 UTC », que la lib ne lisait pas ; chaque session apparaissait « État indéterminé » sans action « Déconnecter ». Maintenant, les dates ISO 8601 permettent d'afficher les sessions actives et l'action de révocation. Les stacks de dev utilisent l'image `core-api:dev-7dfccfc`, qui porte ce format, car aucune release Core ne le contient encore. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))

#### Technique
- Sécurité : `zod` remplacé par le backport vendorisé `vendor/zod` via `$zod`, avec vérification d'intégrité au postinstall, prebuild et pretest ; `follow-redirects` passe en 1.16.2 ; Next.js et Node (24.22.1, Dockerfile et CI) sont mis à jour ; la preuve de bundle par source maps est ajoutée (MAIR-743, MAIR-770, [#181](https://github.com/mairie360/Settings_Web_Service/pull/181), [#173](https://github.com/mairie360/Settings_Web_Service/pull/173), [#171](https://github.com/mairie360/Settings_Web_Service/pull/171), [#164](https://github.com/mairie360/Settings_Web_Service/pull/164)).
- Librairie `@mairie360/lib-components` passée de 0.10.2 à 1.0.3 (version majeure), avec `@types/jest-axe` (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156)).
- Conformité : workflow `gdpr-pr.yml` (checklist RGPD des PR, MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99)), simulation RGPD avant prod (`gdpr_simulation_test.sh`, MAIR-497, [#178](https://github.com/mairie360/Settings_Web_Service/pull/178), [#179](https://github.com/mairie360/Settings_Web_Service/pull/179)), et stack RGAA avec `accessibility_test.sh` (MAIR-316, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92) ; MAIR-768, [#169](https://github.com/mairie360/Settings_Web_Service/pull/169)).
- Épinglage de `mairie360/CICD` mis à jour à plusieurs reprises (v4.5.0, v4.12.2, v5.1.0, v5.2.2, v5.3.0, v5.3.1) et mises à jour automatiques Renovate (MAIR-771, [#177](https://github.com/mairie360/Settings_Web_Service/pull/177) ; [#163](https://github.com/mairie360/Settings_Web_Service/pull/163)).

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Le champ téléphone du profil affiche d'abord la phrase « Visible par tous les agents de la mairie (usage professionnel). », reliée au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))

#### Changements de comportement
- L'onglet Sécurité affiche les sessions avec le `SessionList` de la lib (appareil, IP, création, expiration ou révocation, état), avec ses états chargement, vide et indisponible. L'action de ligne ouvre une confirmation `ConfirmModal` ; si le port de révocation n'est pas branché, un message en attente s'affiche. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Les onglets et l'en-tête des réglages changent : les styles locaux des onglets sont retirés, les onglets utilisent le composant `Tabs` de la lib avec des ids stables `settings-tab-<key>`, et le titre passe par `PageHeader`. La mise en page en grille par largeur d'écran disparaît. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Le shell (barre latérale, en-tête, pied de page, date de la page) vient de la lib ; les composants locaux correspondants sont supprimés. (MAIR-578, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Corrections
- Sessions : avant, Core renvoyait les dates au format « 2026-01-14 07:30:00 UTC », que la lib ne lisait pas ; chaque session apparaissait « État indéterminé » sans action « Déconnecter ». Maintenant, les dates ISO 8601 permettent d'afficher les sessions actives et l'action de révocation. Les stacks de dev utilisent l'image `core-api:dev-7dfccfc`, qui porte ce format, car aucune release Core ne le contient encore. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))

#### Technique
- Sécurité : `zod` remplacé par le backport vendorisé `vendor/zod` via `$zod`, avec vérification d'intégrité au postinstall, prebuild et pretest ; `follow-redirects` passe en 1.16.2 ; Next.js et Node (24.22.1, Dockerfile et CI) sont mis à jour ; la preuve de bundle par source maps est ajoutée (MAIR-743, MAIR-770, [#181](https://github.com/mairie360/Settings_Web_Service/pull/181), [#173](https://github.com/mairie360/Settings_Web_Service/pull/173), [#171](https://github.com/mairie360/Settings_Web_Service/pull/171), [#164](https://github.com/mairie360/Settings_Web_Service/pull/164)).
- Librairie `@mairie360/lib-components` passée de 0.10.2 à 1.0.3 (version majeure), avec `@types/jest-axe` (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156)).
- Conformité : workflow `gdpr-pr.yml` (checklist RGPD des PR, MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99)), simulation RGPD avant prod (`gdpr_simulation_test.sh`, MAIR-497, [#178](https://github.com/mairie360/Settings_Web_Service/pull/178), [#179](https://github.com/mairie360/Settings_Web_Service/pull/179)), et stack RGAA avec `accessibility_test.sh` (MAIR-316, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92) ; MAIR-768, [#169](https://github.com/mairie360/Settings_Web_Service/pull/169)).
- Épinglage de `mairie360/CICD` mis à jour à plusieurs reprises (v4.5.0, v4.12.2, v5.1.0, v5.2.2, v5.3.0, v5.3.1) et mises à jour automatiques Renovate (MAIR-771, [#177](https://github.com/mairie360/Settings_Web_Service/pull/177) ; [#163](https://github.com/mairie360/Settings_Web_Service/pull/163)).

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-04 18:36 UTC | dev | — | `069c282` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/41887456140) |
| 2026-11-04 18:12 UTC | dev | — | `6bf76b4` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/41882651874) |
| 2026-11-03 14:58 UTC | dev | — | `828e84d` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/41656831270) |
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
