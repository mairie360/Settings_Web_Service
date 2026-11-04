# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "df22d9d5c670a7422c3daded12663dc743870245", "prod": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod_tag": "v1.7.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-11-04 21:15 UTC", "prod": "2026-10-21 11:20 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.7.0 | `a2bf3c6` | 2026-10-21 11:20 UTC |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `df22d9d` | 2026-11-04 21:15 UTC |

## Ajouté sur main depuis la dernière release prod (v1.7.0)

#### Nouveautés
- Le champ Téléphone du formulaire de profil affiche désormais l’aide « Visible par tous les agents de la mairie (usage professionnel). Chiffres, espaces, points, tirets et parenthèses, avec un + initial facultatif (32 caractères maximum). » L’aide est reliée au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))

#### Changements de comportement
- Refonte de l’interface sur la bibliothèque `@mairie360/lib-components`, passée de 0.10.2 à 1.0.3 (version majeure) : la coque (barre latérale, en-tête, date) vient de `AccessibleShell` et `PageHeader`, les onglets ont des identifiants stables `settings-tab-<clé>`, et les anciennes classes `.settings-tab` et le composant `settings-tab-icon.tsx` sont retirés. Un test E2E ou un sélecteur qui visait les anciens éléments doit être mis à jour. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Onglet Sécurité : les sessions sont affichées par le `SessionList` de la lib (appareil, IP, création, expiration ou révocation, état). L’action de ligne ouvre une confirmation `ConfirmModal` avant de révoquer la session. (MAIR-607, MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Corrections
- Sessions de l’onglet Sécurité : avant, Core API renvoyait les dates au format « 2026-01-14 07:30:00 UTC », que la lib ne lit pas. Chaque session apparaissait en « État indéterminé », sans action « Déconnecter ». Maintenant, avec Core API en ISO 8601, les sessions sont actives et ont leur action. Le correctif est côté Core ; ce dépôt ne change pas son code d’exécution et les stacks de test passent à `core-api:dev-7dfccfc`. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))
- Dépendance `follow-redirects` (via axios) : avant, les versions 1.16.0 et 1.16.1 pouvaient transmettre des identifiants personnalisés lors d’une redirection inter-origine (GHSA-mrwp-f3q8-3g9p). Maintenant, le lock résout la 1.16.2. ([#171](https://github.com/mairie360/Settings_Web_Service/pull/171))
- Dépendance `zod` : avant, la 3.25.76 était utilisée (GHSA-mrhx-c7xc-m3w5). Maintenant, le backport vendoré `vendor/zod` (3.25.76+mairie360.1) la remplace via `file:vendor/zod` et l’override `$zod`. (MAIR-770, [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- Dépendances Next.js : d’après la description, les versions vulnérables sont mises à jour vers le correctif de GHSA-673q-mjm6-r5xr. Les images Docker et les workflows passent sur Node 24.22.1 avec des digests officiels corrigés. ([#164](https://github.com/mairie360/Settings_Web_Service/pull/164))

#### Technique
- Bumps de mairie360/CICD dans `cicd.yml`, `promote-*.yml`, `dev-dependency-exception.yml` et `gdpr-pr.yml` : v4.5.0, v5.1.0, v5.2.2, v5.3.0 puis v5.3.1, v5.5.0 ([#163](https://github.com/mairie360/Settings_Web_Service/pull/163), [#92](https://github.com/mairie360/Settings_Web_Service/pull/92), [#177](https://github.com/mairie360/Settings_Web_Service/pull/177), [#178](https://github.com/mairie360/Settings_Web_Service/pull/178), [#179](https://github.com/mairie360/Settings_Web_Service/pull/179), [#162](https://github.com/mairie360/Settings_Web_Service/pull/162)).
- Tests E2E Playwright des parcours utilisateur (`e2e/`, `e2e_test.sh`, `docker-compose-e2e.yml`), hors `npm test`. (MAIR-603, [#162](https://github.com/mairie360/Settings_Web_Service/pull/162))
- Simulation RGPD d’usage avant prod (`docker-compose-gdpr-simulation.yml`, `gdpr_simulation_test.sh`, `gdpr-journey.yaml`) et correctifs du script : contrôle du JWT dans les logs, arrêt de la pile, clés Redis lues ligne à ligne. (MAIR-497, [#178](https://github.com/mairie360/Settings_Web_Service/pull/178), [#179](https://github.com/mairie360/Settings_Web_Service/pull/179))
- Gitleaks : `.gitleaks.toml` n’ignore plus le fichier de manifest par chemin, mais seulement les digests SHA-256 de `generic-api-key`, avec un test de politique et de manifest canonique. (MAIR-743, MAIR-770, [#181](https://github.com/mairie360/Settings_Web_Service/pull/181), [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- Stack RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml` (état `session-revoke-dialog` réactivé), verrou `.rgaa-run.lock`, délais bornés sur les attentes. (MAIR-316, MAIR-768, MAIR-767, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92), [#169](https://github.com/mairie360/Settings_Web_Service/pull/169), [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))
- Nouveau workflow `gdpr-pr.yml` (checklist RGPD de la description de PR) et règle Renovate associée. (MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99))
- `next.config.ts` n’émet de source maps qu’en build de mesure CI ; scripts de vérification de provenance du bundle ; documentation Figma et convention d’arborescence des composants dans `CLAUDE.md` et `README.md`. (MAIR-608, MAIR-770, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156), [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Le champ Téléphone du formulaire de profil affiche désormais l’aide « Visible par tous les agents de la mairie (usage professionnel). Chiffres, espaces, points, tirets et parenthèses, avec un + initial facultatif (32 caractères maximum). » L’aide est reliée au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))

#### Changements de comportement
- Refonte de l’interface sur la bibliothèque `@mairie360/lib-components`, passée de 0.10.2 à 1.0.3 (version majeure) : la coque (barre latérale, en-tête, date) vient de `AccessibleShell` et `PageHeader`, les onglets ont des identifiants stables `settings-tab-<clé>`, et les anciennes classes `.settings-tab` et le composant `settings-tab-icon.tsx` sont retirés. Un test E2E ou un sélecteur qui visait les anciens éléments doit être mis à jour. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Onglet Sécurité : les sessions sont affichées par le `SessionList` de la lib (appareil, IP, création, expiration ou révocation, état). L’action de ligne ouvre une confirmation `ConfirmModal` avant de révoquer la session. (MAIR-607, MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Corrections
- Sessions de l’onglet Sécurité : avant, Core API renvoyait les dates au format « 2026-01-14 07:30:00 UTC », que la lib ne lit pas. Chaque session apparaissait en « État indéterminé », sans action « Déconnecter ». Maintenant, avec Core API en ISO 8601, les sessions sont actives et ont leur action. Le correctif est côté Core ; ce dépôt ne change pas son code d’exécution et les stacks de test passent à `core-api:dev-7dfccfc`. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))
- Dépendance `follow-redirects` (via axios) : avant, les versions 1.16.0 et 1.16.1 pouvaient transmettre des identifiants personnalisés lors d’une redirection inter-origine (GHSA-mrwp-f3q8-3g9p). Maintenant, le lock résout la 1.16.2. ([#171](https://github.com/mairie360/Settings_Web_Service/pull/171))
- Dépendance `zod` : avant, la 3.25.76 était utilisée (GHSA-mrhx-c7xc-m3w5). Maintenant, le backport vendoré `vendor/zod` (3.25.76+mairie360.1) la remplace via `file:vendor/zod` et l’override `$zod`. (MAIR-770, [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- Dépendances Next.js : d’après la description, les versions vulnérables sont mises à jour vers le correctif de GHSA-673q-mjm6-r5xr. Les images Docker et les workflows passent sur Node 24.22.1 avec des digests officiels corrigés. ([#164](https://github.com/mairie360/Settings_Web_Service/pull/164))

#### Technique
- Bumps de mairie360/CICD dans `cicd.yml`, `promote-*.yml`, `dev-dependency-exception.yml` et `gdpr-pr.yml` : v4.5.0, v5.1.0, v5.2.2, v5.3.0 puis v5.3.1, v5.5.0 ([#163](https://github.com/mairie360/Settings_Web_Service/pull/163), [#92](https://github.com/mairie360/Settings_Web_Service/pull/92), [#177](https://github.com/mairie360/Settings_Web_Service/pull/177), [#178](https://github.com/mairie360/Settings_Web_Service/pull/178), [#179](https://github.com/mairie360/Settings_Web_Service/pull/179), [#162](https://github.com/mairie360/Settings_Web_Service/pull/162)).
- Tests E2E Playwright des parcours utilisateur (`e2e/`, `e2e_test.sh`, `docker-compose-e2e.yml`), hors `npm test`. (MAIR-603, [#162](https://github.com/mairie360/Settings_Web_Service/pull/162))
- Simulation RGPD d’usage avant prod (`docker-compose-gdpr-simulation.yml`, `gdpr_simulation_test.sh`, `gdpr-journey.yaml`) et correctifs du script : contrôle du JWT dans les logs, arrêt de la pile, clés Redis lues ligne à ligne. (MAIR-497, [#178](https://github.com/mairie360/Settings_Web_Service/pull/178), [#179](https://github.com/mairie360/Settings_Web_Service/pull/179))
- Gitleaks : `.gitleaks.toml` n’ignore plus le fichier de manifest par chemin, mais seulement les digests SHA-256 de `generic-api-key`, avec un test de politique et de manifest canonique. (MAIR-743, MAIR-770, [#181](https://github.com/mairie360/Settings_Web_Service/pull/181), [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- Stack RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml` (état `session-revoke-dialog` réactivé), verrou `.rgaa-run.lock`, délais bornés sur les attentes. (MAIR-316, MAIR-768, MAIR-767, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92), [#169](https://github.com/mairie360/Settings_Web_Service/pull/169), [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))
- Nouveau workflow `gdpr-pr.yml` (checklist RGPD de la description de PR) et règle Renovate associée. (MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99))
- `next.config.ts` n’émet de source maps qu’en build de mesure CI ; scripts de vérification de provenance du bundle ; documentation Figma et convention d’arborescence des composants dans `CLAUDE.md` et `README.md`. (MAIR-608, MAIR-770, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156), [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
