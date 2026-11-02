# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "21cd0a13f4120c42b5eb732165e01ecfeecd4a5b", "prod": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod_tag": "v1.7.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-11-02 22:55 UTC", "prod": "2026-10-21 11:20 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.7.0 | `a2bf3c6` | 2026-10-21 11:20 UTC |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `21cd0a1` | 2026-11-02 22:55 UTC |

## Ajouté sur main depuis la dernière release prod (v1.7.0)

#### Nouveautés
- Les sessions du compte sont désormais affichées avec leur état actif et l'action « Déconnecter », car Core API renvoie les dates au format ISO 8601. L'onglet Sécurité reprend le `SessionList` de la lib et l'action ouvre une boîte de confirmation. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))
- Le texte d'aide du champ Téléphone du profil commence par « Visible par tous les agents de la mairie (usage professionnel). », relié au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))
- Chaque PR reçoit une vérification de checklist RGPD « GDPR checklist » qui échoue si la section « Personal data » n'est pas renseignée, ou si « Yes » est coché sans l'inventaire. (MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99))
- L'interface de l'application passe sur la bibliothèque UI normalisée : en-tête de page, onglets, champs, boutons, notifications et composants de session. Les anciens composants locaux sont supprimés. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Changements de comportement
- Le texte d'aide du champ Téléphone change : il commence désormais par la mention de visibilité, puis reprend les règles de format précédentes. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))
- Les onglets de la page Paramètres ne sont plus stylés localement : leur apparence et leurs tailles suivent la bibliothèque, et le shell de l'application (barre latérale, barre supérieure, pied de page, date) vient de `@mairie360/lib-components`. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Le lien de la pull request « GDPR checklist » devient une vérification à rendre obligatoire dans la protection de branche de `main`. (MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99))

#### Corrections
- Les dates de session sont renvoyées au format ISO 8601 par Core API : avant, elles s'affichaient « État indéterminé » sans action « Déconnecter » ; maintenant la session est active et révocable. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))
- Le transitif `follow-redirects` passe de 1.16.0–1.16.1 à 1.16.2 : `npm audit --omit=dev` ne signale plus GHSA-mrwp-f3q8-3g9p. (sans clé Jira, [#171](https://github.com/mairie360/Settings_Web_Service/pull/171))
- `zod` est remplacé par un correctif vendorisé (3.25.76+mairie360.1) pour corriger GHSA-mrhx-c7xc-m3w5 ; la preuve de bundle passe par les source maps. (MAIR-770, [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- Le stack d'accessibilité ne bloque plus sur un service absent : les boucles d'attente échouent après un nombre fixe de tentatives, et `down -v` n'efface plus les volumes du stack de dev. (MAIR-768, [#169](https://github.com/mairie360/Settings_Web_Service/pull/169))
- Node.js passe en 24.22.1 et Next.js est mis à jour vers la version corrigée (GHSA-673q-mjm6-r5xr). (sans clé Jira, [#164](https://github.com/mairie360/Settings_Web_Service/pull/164))

#### Technique
- Mise à jour du pin mairie360/CICD v4.4.3 → v4.5.0 par Renovate, puis passage à v5.1.0 pour le moteur RGAA (sans clé Jira, [#163](https://github.com/mairie360/Settings_Web_Service/pull/163)).
- Ajout d'un stack et d'un script d'accessibilité RGAA (`accessibility_test.sh`, `rgaa.yaml`), de tests de politique CI et de la configuration Gitleaks. (MAIR-316, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92))
- Tests de politique et de bundle ajoutés, dont la vérification des sources et des fichiers vendorisés de zod. (MAIR-770, [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- Vérifications de structure de l'arborescence de composants et exclusion des tests de la couverture source. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Les sessions du compte sont désormais affichées avec leur état actif et l'action « Déconnecter », car Core API renvoie les dates au format ISO 8601. L'onglet Sécurité reprend le `SessionList` de la lib et l'action ouvre une boîte de confirmation. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))
- Le texte d'aide du champ Téléphone du profil commence par « Visible par tous les agents de la mairie (usage professionnel). », relié au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))
- Chaque PR reçoit une vérification de checklist RGPD « GDPR checklist » qui échoue si la section « Personal data » n'est pas renseignée, ou si « Yes » est coché sans l'inventaire. (MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99))
- L'interface de l'application passe sur la bibliothèque UI normalisée : en-tête de page, onglets, champs, boutons, notifications et composants de session. Les anciens composants locaux sont supprimés. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Changements de comportement
- Le texte d'aide du champ Téléphone change : il commence désormais par la mention de visibilité, puis reprend les règles de format précédentes. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))
- Les onglets de la page Paramètres ne sont plus stylés localement : leur apparence et leurs tailles suivent la bibliothèque, et le shell de l'application (barre latérale, barre supérieure, pied de page, date) vient de `@mairie360/lib-components`. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- Le lien de la pull request « GDPR checklist » devient une vérification à rendre obligatoire dans la protection de branche de `main`. (MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99))

#### Corrections
- Les dates de session sont renvoyées au format ISO 8601 par Core API : avant, elles s'affichaient « État indéterminé » sans action « Déconnecter » ; maintenant la session est active et révocable. (MAIR-767, [#175](https://github.com/mairie360/Settings_Web_Service/pull/175))
- Le transitif `follow-redirects` passe de 1.16.0–1.16.1 à 1.16.2 : `npm audit --omit=dev` ne signale plus GHSA-mrwp-f3q8-3g9p. (sans clé Jira, [#171](https://github.com/mairie360/Settings_Web_Service/pull/171))
- `zod` est remplacé par un correctif vendorisé (3.25.76+mairie360.1) pour corriger GHSA-mrhx-c7xc-m3w5 ; la preuve de bundle passe par les source maps. (MAIR-770, [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- Le stack d'accessibilité ne bloque plus sur un service absent : les boucles d'attente échouent après un nombre fixe de tentatives, et `down -v` n'efface plus les volumes du stack de dev. (MAIR-768, [#169](https://github.com/mairie360/Settings_Web_Service/pull/169))
- Node.js passe en 24.22.1 et Next.js est mis à jour vers la version corrigée (GHSA-673q-mjm6-r5xr). (sans clé Jira, [#164](https://github.com/mairie360/Settings_Web_Service/pull/164))

#### Technique
- Mise à jour du pin mairie360/CICD v4.4.3 → v4.5.0 par Renovate, puis passage à v5.1.0 pour le moteur RGAA (sans clé Jira, [#163](https://github.com/mairie360/Settings_Web_Service/pull/163)).
- Ajout d'un stack et d'un script d'accessibilité RGAA (`accessibility_test.sh`, `rgaa.yaml`), de tests de politique CI et de la configuration Gitleaks. (MAIR-316, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92))
- Tests de politique et de bundle ajoutés, dont la vérification des sources et des fichiers vendorisés de zod. (MAIR-770, [#173](https://github.com/mairie360/Settings_Web_Service/pull/173))
- Vérifications de structure de l'arborescence de composants et exclusion des tests de la couverture source. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
