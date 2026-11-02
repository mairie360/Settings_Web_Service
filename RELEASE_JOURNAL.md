# Journal des releases — Settings_Web_Service

<!-- release-journal-state {"dev": "9ed8ea7f381a4762f4dde8d4ab2510864a43b99d", "prod": "a2bf3c68882e787a45e923d87f057b92bdde7553", "prod_tag": "v1.7.0", "staging": "a2bf3c68882e787a45e923d87f057b92bdde7553", "updated": {"dev": "2026-11-02 16:16 UTC", "prod": "2026-10-21 11:20 UTC", "staging": "2026-10-21 11:18 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.7.0 | `a2bf3c6` | 2026-10-21 11:20 UTC |
| staging | — | `a2bf3c6` | 2026-10-21 11:18 UTC |
| dev | — | `9ed8ea7` | 2026-11-02 16:16 UTC |

## Ajouté sur main depuis la dernière release prod (v1.7.0)

#### Nouveautés
- Le champ Téléphone du formulaire de profil commence désormais son aide par « Visible par tous les agents de la mairie (usage professionnel). ». L'aide est reliée au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))

#### Changements de comportement
- Les onglets des paramètres sont rendus par le composant `Tabs` de la lib : leurs identifiants DOM deviennent `settings-tab-<clé>` et leur style local est retiré, donc l'apparence change et un sélecteur visant les anciennes classes `.settings-tab` ne trouve plus rien. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- L'en-tête de page passe par `PageHeader` et l'enveloppe de page ainsi que la barre latérale par `AccessibleShell` de la lib. Les composants locaux `desktop-navigation`, `current-date`, `accessible-shell` et `sidebar-preference` sont supprimés, et la mise en page visuelle de la page change. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- L'onglet Sécurité affiche les sessions avec le `SessionList` de la lib (appareil, IP, création, expiration ou révocation, état, avec les états chargement, vide et indisponible). (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- La révocation d'une session passe par une confirmation `ConfirmModal` de la lib ; la session n'est marquée révoquée qu'après confirmation, et un message d'attente s'affiche tant que le port de fonctionnalité n'est pas branché. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Technique
- Dépendances et sécurité : zod remplacé par le backport vendorisé `vendor/zod` (3.25.76+mairie360.1) via l'override `$zod`, `follow-redirects` passé en 1.16.2, Node.js 24.22.1 et Next.js de maintenance corrigé, `@mairie360/lib-components` passé de 0.10.2 à 1.0.3 (version majeure), `cicd` épinglé en v4.5.0 puis v5.1.0. (MAIR-770 [#173](https://github.com/mairie360/Settings_Web_Service/pull/173), [#171](https://github.com/mairie360/Settings_Web_Service/pull/171), [#164](https://github.com/mairie360/Settings_Web_Service/pull/164), [#163](https://github.com/mairie360/Settings_Web_Service/pull/163), [#156](https://github.com/mairie360/Settings_Web_Service/pull/156), [#92](https://github.com/mairie360/Settings_Web_Service/pull/92))
- CI et tests : stack d'accessibilité RGAA avec son script et son `rgaa.yaml` (MAIR-316, MAIR-768, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92), [#169](https://github.com/mairie360/Settings_Web_Service/pull/169)), checklist RGPD sur les PR (MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99)), preuve de bundle par source maps et vérifications d'intégrité hors ligne (MAIR-770, [#173](https://github.com/mairie360/Settings_Web_Service/pull/173)).

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Le champ Téléphone du formulaire de profil commence désormais son aide par « Visible par tous les agents de la mairie (usage professionnel). ». L'aide est reliée au champ par `aria-describedby`. (MAIR-292, [#100](https://github.com/mairie360/Settings_Web_Service/pull/100))

#### Changements de comportement
- Les onglets des paramètres sont rendus par le composant `Tabs` de la lib : leurs identifiants DOM deviennent `settings-tab-<clé>` et leur style local est retiré, donc l'apparence change et un sélecteur visant les anciennes classes `.settings-tab` ne trouve plus rien. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- L'en-tête de page passe par `PageHeader` et l'enveloppe de page ainsi que la barre latérale par `AccessibleShell` de la lib. Les composants locaux `desktop-navigation`, `current-date`, `accessible-shell` et `sidebar-preference` sont supprimés, et la mise en page visuelle de la page change. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- L'onglet Sécurité affiche les sessions avec le `SessionList` de la lib (appareil, IP, création, expiration ou révocation, état, avec les états chargement, vide et indisponible). (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))
- La révocation d'une session passe par une confirmation `ConfirmModal` de la lib ; la session n'est marquée révoquée qu'après confirmation, et un message d'attente s'affiche tant que le port de fonctionnalité n'est pas branché. (MAIR-608, [#156](https://github.com/mairie360/Settings_Web_Service/pull/156))

#### Technique
- Dépendances et sécurité : zod remplacé par le backport vendorisé `vendor/zod` (3.25.76+mairie360.1) via l'override `$zod`, `follow-redirects` passé en 1.16.2, Node.js 24.22.1 et Next.js de maintenance corrigé, `@mairie360/lib-components` passé de 0.10.2 à 1.0.3 (version majeure), `cicd` épinglé en v4.5.0 puis v5.1.0. (MAIR-770 [#173](https://github.com/mairie360/Settings_Web_Service/pull/173), [#171](https://github.com/mairie360/Settings_Web_Service/pull/171), [#164](https://github.com/mairie360/Settings_Web_Service/pull/164), [#163](https://github.com/mairie360/Settings_Web_Service/pull/163), [#156](https://github.com/mairie360/Settings_Web_Service/pull/156), [#92](https://github.com/mairie360/Settings_Web_Service/pull/92))
- CI et tests : stack d'accessibilité RGAA avec son script et son `rgaa.yaml` (MAIR-316, MAIR-768, [#92](https://github.com/mairie360/Settings_Web_Service/pull/92), [#169](https://github.com/mairie360/Settings_Web_Service/pull/169)), checklist RGPD sur les PR (MAIR-295, [#99](https://github.com/mairie360/Settings_Web_Service/pull/99)), preuve de bundle par source maps et vérifications d'intégrité hors ligne (MAIR-770, [#173](https://github.com/mairie360/Settings_Web_Service/pull/173)).

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
