# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "828e84d050b9b6ca00815b97b687dfd07f3d34b9", "prod": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod_tag": "v1.7.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-11-03 14:58 UTC", "prod": "2026-10-21 11:20 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.7.0 | `a2bf3c6` | 2026-10-21 11:20 UTC |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `828e84d` | 2026-11-03 14:58 UTC |

## Ajouté sur main depuis la dernière release prod (v1.7.0)

#### Nouveautés
- L'onglet Sécurité affiche les sessions avec le `SessionList` de la lib. L'action de révocation ouvre une confirmation (`ConfirmModal`) qui marque la session révoquée une fois confirmée. Tant que le port de fonctionnalité n'est pas branché, un message « en attente » s'affiche. (MAIR-607, MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Le champ Téléphone du profil affiche d'abord « Visible par tous les agents de la mairie (usage professionnel). », relié au champ par `aria-describedby`, puis la règle de format. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))

#### Changements de comportement
- Les écrans de Settings sont normalisés sur la lib (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156)) : en-tête, onglets (identifiants stables `settings-tab-<key>`), champs, boutons, notifications par ton et badges de statut. La disposition des onglets suit désormais celle de la lib, et le shell (barre latérale, pied de page, date) vient de la lib : les composants locaux `accessible-shell`, `desktop-navigation` et `current-date` ont disparu.

#### Corrections
- Sécurité, sessions : avant, Core renvoyait les dates au format « 2026-01-14 07:30:00 UTC », que la lib ne lit pas. Chaque session affichait « État indéterminé » sans action « Déconnecter ». Maintenant, Core renvoie des dates ISO 8601 et les sessions s'affichent actives avec leur action. Ce correctif dépend de l'image dev de Core API (`dev-7dfccfc`), car aucune release de Core ne l'inclut encore. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))

#### Technique
- Sécurité des dépendances : `follow-redirects` passe en 1.16.2 (GHSA-mrwp-f3q8-3g9p). `zod` est remplacé par le backport vendorisé 3.25.76+mairie360.1 (GHSA-mrhx-c7xc-m3w5), avec vérification d'intégrité à l'installation et au build. Les images Node (24.22.1) et Next.js sont mises à jour. (MAIR-770, MAIR-771, [#171](https://github.com/mairie360/Settings_Web_Service/pull/171), [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- CICD est épinglé d'abord en v5.2.2, puis en v5.3.0, dans les workflows `cicd.yml`, `promote-*.yml` et `dev-dependency-exception.yml`. Une checklist RGPD s'exécute désormais sur les PR (`gdpr-pr.yml`, MAIR-295). Une simulation RGPD est ajoutée aux stacks de test (MAIR-497, [#178](https://github.com/mairie360/Settings_Web_Service/pull/178)). Les sources maps ne sont produites que par le build de mesure CI.
- Stacks de test RGAA (MAIR-316, MAIR-768) : scénario de révocation de session, verrou de run, projet Compose dédié et boucles d'attente bornées. Les fichiers de test sont exclus de la couverture des sources.

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- L'onglet Sécurité affiche les sessions avec le `SessionList` de la lib. L'action de révocation ouvre une confirmation (`ConfirmModal`) qui marque la session révoquée une fois confirmée. Tant que le port de fonctionnalité n'est pas branché, un message « en attente » s'affiche. (MAIR-607, MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Le champ Téléphone du profil affiche d'abord « Visible par tous les agents de la mairie (usage professionnel). », relié au champ par `aria-describedby`, puis la règle de format. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))

#### Changements de comportement
- Les écrans de Settings sont normalisés sur la lib (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156)) : en-tête, onglets (identifiants stables `settings-tab-<key>`), champs, boutons, notifications par ton et badges de statut. La disposition des onglets suit désormais celle de la lib, et le shell (barre latérale, pied de page, date) vient de la lib : les composants locaux `accessible-shell`, `desktop-navigation` et `current-date` ont disparu.

#### Corrections
- Sécurité, sessions : avant, Core renvoyait les dates au format « 2026-01-14 07:30:00 UTC », que la lib ne lit pas. Chaque session affichait « État indéterminé » sans action « Déconnecter ». Maintenant, Core renvoie des dates ISO 8601 et les sessions s'affichent actives avec leur action. Ce correctif dépend de l'image dev de Core API (`dev-7dfccfc`), car aucune release de Core ne l'inclut encore. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))

#### Technique
- Sécurité des dépendances : `follow-redirects` passe en 1.16.2 (GHSA-mrwp-f3q8-3g9p). `zod` est remplacé par le backport vendorisé 3.25.76+mairie360.1 (GHSA-mrhx-c7xc-m3w5), avec vérification d'intégrité à l'installation et au build. Les images Node (24.22.1) et Next.js sont mises à jour. (MAIR-770, MAIR-771, [#171](https://github.com/mairie360/Settings_Web_Service/pull/171), [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- CICD est épinglé d'abord en v5.2.2, puis en v5.3.0, dans les workflows `cicd.yml`, `promote-*.yml` et `dev-dependency-exception.yml`. Une checklist RGPD s'exécute désormais sur les PR (`gdpr-pr.yml`, MAIR-295). Une simulation RGPD est ajoutée aux stacks de test (MAIR-497, [#178](https://github.com/mairie360/Settings_Web_Service/pull/178)). Les sources maps ne sont produites que par le build de mesure CI.
- Stacks de test RGAA (MAIR-316, MAIR-768) : scénario de révocation de session, verrou de run, projet Compose dédié et boucles d'attente bornées. Les fichiers de test sont exclus de la couverture des sources.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
