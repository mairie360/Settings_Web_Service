# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "86f6ee7ae1d11ac47410e5274835530d69b50468", "prod": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod_tag": "v1.7.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-11-12 17:11 UTC", "prod": "2026-10-21 11:20 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.7.0 | `a2bf3c6` | 2026-10-21 11:20 UTC |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `86f6ee7` | 2026-11-12 17:11 UTC |

## Ajouté sur main depuis la dernière release prod (v1.7.0)

- fix: MAIR-816 Release dev: align internal versions and deploy ([#187](https://github.com/mairie360/Settings_Web_Service/pull/187))
- chore(deps): update dependency mairie360/cicd to v5.6.0 (#185) ([#185](https://github.com/mairie360/Settings_Web_Service/pull/185))
- feat: MAIR-603 E2E - Parcours utilisateurs Playwright des fronts (#162) ([#162](https://github.com/mairie360/Settings_Web_Service/pull/162))
- fix: MAIR-743 [Audit 30/10] Login, Calendars, Elearning, Projects: branch Gitleaks fingerprints invalid after squash, main likely red (N1) (#181) ([#181](https://github.com/mairie360/Settings_Web_Service/pull/181))
- fix: MAIR-497 GDPR - Usage simulation and AI review of logs and database before prod ([#179](https://github.com/mairie360/Settings_Web_Service/pull/179))
- feat: MAIR-497 RGPD - Simulation d'usage et revue IA des logs et de la base avant la prod ([#178](https://github.com/mairie360/Settings_Web_Service/pull/178))
- ci: MAIR-771 APIs, BFFs, Database : monter CICD en v5.2.2 pour activer les contrôles RGPD (#177) ([#177](https://github.com/mairie360/Settings_Web_Service/pull/177))
- fix: MAIR-767 Core API - Renvoyer les dates de session au format ISO 8601 (#175) ([#175](https://github.com/mairie360/Settings_Web_Service/pull/175))
- fix(security): MAIR-770 Administrator, Dashboard, Messages, Settings : porter le correctif zod et la preuve de bundle par source maps ([#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- fix(deps): bump follow-redirects to 1.16.2 (GHSA-mrwp-f3q8-3g9p) ([#171](https://github.com/mairie360/Settings_Web_Service/pull/171))
- fix: MAIR-768 RGAA - Aligner les stacks d'accessibilité des fronts mergés en premier ([#169](https://github.com/mairie360/Settings_Web_Service/pull/169))
- feat: MAIR-316 RGAA - Périmètre et états des pages par front (#92) ([#92](https://github.com/mairie360/Settings_Web_Service/pull/92))
- feat: MAIR-292 Ajouter des tests Playwright RGPD et les pages légales aux fronts (#100) ([#100](https://github.com/mairie360/Settings_Web_Service/pull/100))
- ci: MAIR-295 Ajouter une checklist RGPD aux PR et des rappels d'échéances automatiques (#99) ([#99](https://github.com/mairie360/Settings_Web_Service/pull/99))
- chore(deps): update dependency mairie360/cicd to v4.5.0 (#163) ([#163](https://github.com/mairie360/Settings_Web_Service/pull/163))
- fix(security): patch Node.js and Next.js (#164) ([#164](https://github.com/mairie360/Settings_Web_Service/pull/164))
- feat!: MAIR-608 Lib UI - Normaliser la charte, les tailles et les composants partagés des fronts ([#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

## Différence dev → staging (en dev, pas encore en staging)

- fix: MAIR-816 Release dev: align internal versions and deploy ([#187](https://github.com/mairie360/Settings_Web_Service/pull/187))
- chore(deps): update dependency mairie360/cicd to v5.6.0 (#185) ([#185](https://github.com/mairie360/Settings_Web_Service/pull/185))
- feat: MAIR-603 E2E - Parcours utilisateurs Playwright des fronts (#162) ([#162](https://github.com/mairie360/Settings_Web_Service/pull/162))
- fix: MAIR-743 [Audit 30/10] Login, Calendars, Elearning, Projects: branch Gitleaks fingerprints invalid after squash, main likely red (N1) (#181) ([#181](https://github.com/mairie360/Settings_Web_Service/pull/181))
- fix: MAIR-497 GDPR - Usage simulation and AI review of logs and database before prod ([#179](https://github.com/mairie360/Settings_Web_Service/pull/179))
- feat: MAIR-497 RGPD - Simulation d'usage et revue IA des logs et de la base avant la prod ([#178](https://github.com/mairie360/Settings_Web_Service/pull/178))
- ci: MAIR-771 APIs, BFFs, Database : monter CICD en v5.2.2 pour activer les contrôles RGPD (#177) ([#177](https://github.com/mairie360/Settings_Web_Service/pull/177))
- fix: MAIR-767 Core API - Renvoyer les dates de session au format ISO 8601 (#175) ([#175](https://github.com/mairie360/Settings_Web_Service/pull/175))
- fix(security): MAIR-770 Administrator, Dashboard, Messages, Settings : porter le correctif zod et la preuve de bundle par source maps ([#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- fix(deps): bump follow-redirects to 1.16.2 (GHSA-mrwp-f3q8-3g9p) ([#171](https://github.com/mairie360/Settings_Web_Service/pull/171))
- fix: MAIR-768 RGAA - Aligner les stacks d'accessibilité des fronts mergés en premier ([#169](https://github.com/mairie360/Settings_Web_Service/pull/169))
- feat: MAIR-316 RGAA - Périmètre et états des pages par front (#92) ([#92](https://github.com/mairie360/Settings_Web_Service/pull/92))
- feat: MAIR-292 Ajouter des tests Playwright RGPD et les pages légales aux fronts (#100) ([#100](https://github.com/mairie360/Settings_Web_Service/pull/100))
- ci: MAIR-295 Ajouter une checklist RGPD aux PR et des rappels d'échéances automatiques (#99) ([#99](https://github.com/mairie360/Settings_Web_Service/pull/99))
- chore(deps): update dependency mairie360/cicd to v4.5.0 (#163) ([#163](https://github.com/mairie360/Settings_Web_Service/pull/163))
- fix(security): patch Node.js and Next.js (#164) ([#164](https://github.com/mairie360/Settings_Web_Service/pull/164))
- feat!: MAIR-608 Lib UI - Normaliser la charte, les tailles et les composants partagés des fronts ([#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

> Résumé Claude indisponible pour ce passage : listes brutes des commits.

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-12 17:11 UTC | dev | — | `86f6ee7` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/43264740056) |
| 2026-11-04 21:15 UTC | dev | — | `df22d9d` | [run](https://github.com/mairie360/Settings_Web_Service/actions/runs/41912462949) |
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
