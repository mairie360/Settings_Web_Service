# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "6bf76b4fddfa0079f0301015ceb9206ab8639385", "prod": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod_tag": "v1.7.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-11-04 18:12 UTC", "prod": "2026-10-21 11:20 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.7.0 | `a2bf3c6` | 2026-10-21 11:20 UTC |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `6bf76b4` | 2026-11-04 18:12 UTC |

## Ajouté sur main depuis la dernière release prod (v1.7.0)

#### Nouveautés
- Champ téléphone du profil : l'aide commence désormais par « Visible par tous les agents de la mairie (usage professionnel). », relié au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))
- Onglet Sécurité : la liste des sessions est le `SessionList` de la lib. L'action de ligne ouvre une confirmation (`SessionRevokeDialog`, `ConfirmModal`) avant d'appeler le port `revokeSession`. Si le port n'est pas branché, un message d'attente s'affiche, d'après la description de la PR. (MAIR-607, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Changements de comportement
- Réglages refondus sur les composants normalisés de la lib (onglets, en-tête, champs, boutons, notifications). Les classes CSS locales `.settings-tab` sont retirées et les onglets portent les ids `settings-tab-<clé>`. Un sélecteur qui visait l'ancienne structure doit être mis à jour. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Le shell (barre latérale, en-tête, pied de page, date) vient de `@mairie360/lib-components/shell`. Les composants locaux `desktop-navigation`, `accessible-shell` et `sidebar-preference` sont supprimés. (MAIR-578, MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Corrections
- Sécurité, sessions : avant, les dates de session arrivaient au format « 2026-01-14 07:30:00 UTC », que la lib ne lisait pas. Chaque session affichait « État indéterminé » sans action « Déconnecter ». Maintenant, avec une Core API qui renvoie de l'ISO 8601, les sessions s'affichent actives avec leur action. Le front ne change pas de code pour cela : l'effet dépend de Core API, et l'image de test `core-api:dev-7dfccfc` n'est pas encore une release. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))

#### Technique
- Dépendances : `@mairie360/lib-components` passe de 0.10.2 à 1.0.3 (version majeure, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156)). Zod est remplacé par le backport vendoré `vendor/zod` (3.25.76+mairie360.1), avec vérification d'intégrité au `postinstall`, `prebuild` et `pretest` ([#173](https://github.com/mairie360/Settings_Web_Service/pull/173)). `follow-redirects` passe en 1.16.2 ([#171](https://github.com/mairie360/Settings_Web_Service/pull/171)).
- Runtime : Node.js 24.22.1 avec digest d'image officiel dans le Dockerfile et les workflows ([#164](https://github.com/mairie360/Settings_Web_Service/pull/164)). Pins mairie360/CICD montés en v4.5.0, v5.2.2, v5.3.0 puis v5.3.1 ([#163](https://github.com/mairie360/Settings_Web_Service/pull/163), [#177](https://github.com/mairie360/Settings_Web_Service/pull/177), [#178](https://github.com/mairie360/Settings_Web_Service/pull/178), [#179](https://github.com/mairie360/Settings_Web_Service/pull/179)).
- Outillage de test et CI sans effet sur l'application : simulation RGPD et checklist des PR (`gdpr-pr.yml`, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99), [#178](https://github.com/mairie360/Settings_Web_Service/pull/178), [#179](https://github.com/mairie360/Settings_Web_Service/pull/179)), stack RGAA et verrou de run ([#92](https://github.com/mairie360/Settings_Web_Service/pull/92), [#169](https://github.com/mairie360/Settings_Web_Service/pull/169)), tests Playwright RGPD ([#100](https://github.com/mairie360/Settings_Web_Service/pull/100)).

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Champ téléphone du profil : l'aide commence désormais par « Visible par tous les agents de la mairie (usage professionnel). », relié au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))
- Onglet Sécurité : la liste des sessions est le `SessionList` de la lib. L'action de ligne ouvre une confirmation (`SessionRevokeDialog`, `ConfirmModal`) avant d'appeler le port `revokeSession`. Si le port n'est pas branché, un message d'attente s'affiche, d'après la description de la PR. (MAIR-607, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Changements de comportement
- Réglages refondus sur les composants normalisés de la lib (onglets, en-tête, champs, boutons, notifications). Les classes CSS locales `.settings-tab` sont retirées et les onglets portent les ids `settings-tab-<clé>`. Un sélecteur qui visait l'ancienne structure doit être mis à jour. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Le shell (barre latérale, en-tête, pied de page, date) vient de `@mairie360/lib-components/shell`. Les composants locaux `desktop-navigation`, `accessible-shell` et `sidebar-preference` sont supprimés. (MAIR-578, MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Corrections
- Sécurité, sessions : avant, les dates de session arrivaient au format « 2026-01-14 07:30:00 UTC », que la lib ne lisait pas. Chaque session affichait « État indéterminé » sans action « Déconnecter ». Maintenant, avec une Core API qui renvoie de l'ISO 8601, les sessions s'affichent actives avec leur action. Le front ne change pas de code pour cela : l'effet dépend de Core API, et l'image de test `core-api:dev-7dfccfc` n'est pas encore une release. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))

#### Technique
- Dépendances : `@mairie360/lib-components` passe de 0.10.2 à 1.0.3 (version majeure, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156)). Zod est remplacé par le backport vendoré `vendor/zod` (3.25.76+mairie360.1), avec vérification d'intégrité au `postinstall`, `prebuild` et `pretest` ([#173](https://github.com/mairie360/Settings_Web_Service/pull/173)). `follow-redirects` passe en 1.16.2 ([#171](https://github.com/mairie360/Settings_Web_Service/pull/171)).
- Runtime : Node.js 24.22.1 avec digest d'image officiel dans le Dockerfile et les workflows ([#164](https://github.com/mairie360/Settings_Web_Service/pull/164)). Pins mairie360/CICD montés en v4.5.0, v5.2.2, v5.3.0 puis v5.3.1 ([#163](https://github.com/mairie360/Settings_Web_Service/pull/163), [#177](https://github.com/mairie360/Settings_Web_Service/pull/177), [#178](https://github.com/mairie360/Settings_Web_Service/pull/178), [#179](https://github.com/mairie360/Settings_Web_Service/pull/179)).
- Outillage de test et CI sans effet sur l'application : simulation RGPD et checklist des PR (`gdpr-pr.yml`, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99), [#178](https://github.com/mairie360/Settings_Web_Service/pull/178), [#179](https://github.com/mairie360/Settings_Web_Service/pull/179)), stack RGAA et verrou de run ([#92](https://github.com/mairie360/Settings_Web_Service/pull/92), [#169](https://github.com/mairie360/Settings_Web_Service/pull/169)), tests Playwright RGPD ([#100](https://github.com/mairie360/Settings_Web_Service/pull/100)).

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
