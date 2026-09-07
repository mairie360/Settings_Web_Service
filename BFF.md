# BFF — Paramètres

Référentiel de besoins harmonisé le 5 septembre 2026. Documentation uniquement : aucune route ni migration n'est créée par ces fichiers. Les chemins BFF sont relatifs au service indiqué, pas au préfixe des proxies Next.js ; les chemins backend conservent leurs préfixes réels.

SettingsModule utilise encore ses données de démonstration. Toutes les routes `/settings/*` ci-dessous sont proposées ; aucun BFF Settings local ne les implémente. Profil est un sous-onglet de Paramètres, avec Sécurité, Notifications, Apparence, Général et Système.

Tables et routes propriétaires : [BACKEND.md](BACKEND.md).

`Existant` : déclaré dans les sources locales ; `Partiel` : route présente mais données manquantes, SQL direct ou mémoire ; `Client généré` : chemin observé dans le client installé, déploiement non vérifié ; `Proposé` : contrat cible à implémenter/valider. Pour les tables, `SQL observé` ne prouve pas qu'une migration est déployée.

## Routes communes

Les identifiants renvoyés par un domaine restent ceux de son backend, même lorsqu'un BFF les sérialise en chaîne. `phone` côté Core/DTO correspond à `users.phone_number` en SQL ; `name`/`fullName` est composé à partir du prénom et du nom, sans découpage automatique inverse. Les rôles d'affichage sont adaptés par chaque front à partir de `roles`, sans nouvelle table de rôles par module. Le profil s'édite dans **Paramètres > Profil** ; les anciennes pages `/profile` ne définissent pas un stockage distinct.

| Méthode | Service et route BFF | Route backend / source | Données nécessaires au front | État |
| --- | --- | --- | --- | --- |
| GET | BFF User `/me` (alias `/session/me`) | Core `GET /api/v1/user/me/` + `GET /api/v1/groups/` | Identité, rôles et groupes communs ; réponse actuelle `{user, groups, roles}` ; enrichir avec identifiant, avatar, service, poste et dernière connexion | Partiel |
| POST | BFF User `/auth/logout` | Actuel : suppression du cookie ; cible : Core `POST /api/v1/sessions/revoke` avec le refresh token de la session courante | Déconnexion ; révocation serveur à brancher, pas une suppression de toutes les sessions | Partiel |
| GET | BFF User `/notifications` | Core `GET /api/v1/user/me/notifications/` | Notifications du bandeau et compteur non lu ; ne pas utiliser la constante de démonstration 3 | Proposé |
| PATCH | BFF User `/notifications/{notificationId}/read` | Core `PATCH /api/v1/user/me/notifications/{notificationId}/read` | Marquage lu et compteur actualisé pour l'utilisateur connecté | Proposé |

## Routes du module

| Méthode | Service et route BFF | Route backend / source | Données nécessaires au front | État |
| --- | --- | --- | --- | --- |
| GET | BFF Settings `/settings/bootstrap` | Core profil/groupes/sessions/services + préférences/sécurité/stockage/system info ci-dessous | profile, security, sessions, notifications (préférences), appearance, general, systemInfo et annuaire des services | Proposé |
| PATCH | BFF Settings `/settings/profile` | Core `PATCH /api/v1/user/me/` | Prénom/nom adaptés au fullName, e-mail, téléphone, serviceId, poste, biographie | Proposé ; extension Core |
| POST | BFF Settings `/settings/profile/photo` | Core `POST /api/v1/user/me/avatar` → Files `POST /api/v1/files/` | Photo JPG/PNG, 2 MB maximum selon ATP ; avatarUrl restituée après persistance | Proposé |
| PATCH | BFF Settings `/settings/password` | Core `PATCH /api/v1/user/me/password` | Mot de passe actuel, nouveau et confirmation ; pas de mot de passe en lecture | Proposé |
| POST | BFF Settings `/settings/security/enrollments` | Core `POST /api/v1/user/me/security/enrollments` | Initialiser SMS ou application d'authentification ; défi temporaire | Proposé |
| POST | BFF Settings `/settings/security/enrollments/{enrollmentId}/verify` | Core `POST /api/v1/user/me/security/enrollments/{enrollmentId}/verify` | Valider le code avant d'activer smsTwoFactor/authenticatorTwoFactor | Proposé |
| DELETE | BFF Settings `/settings/security/{method}` | Core `DELETE /api/v1/user/me/security/{method}` | Désactiver une méthode après vérification ; refuser si la politique globale l'impose | Proposé |
| DELETE | BFF Settings `/settings/sessions/{sessionId}` | Core `DELETE /api/v1/sessions/{sessionId}` | Déconnecter un autre appareil, conserver la session courante | Proposé ; la route Core existante revoke attend un refresh token |
| PATCH | BFF Settings `/settings/notifications` | Core `PATCH /api/v1/user/me/notification-settings/` | Préférences e-mail, push, desktop, messages, projets, calendrier ; pas les notifications elles-mêmes | Proposé |
| PATCH | BFF Settings `/settings/appearance` | Core `PATCH /api/v1/user/me/preferences/` | Thème clair/sombre/système, police, taille, densité | Proposé |
| PATCH | BFF Settings `/settings/general` | Core `PATCH /api/v1/user/me/preferences/` | Langue, fuseau, format de date, page d'accueil, ouverture automatique des notifications | Proposé |
| GET | BFF Settings `/settings/system` | Core `GET /api/v1/system/info` + Files `GET /api/v1/files/storage/me` | Version/déploiement, stockage utilisé/quota ; navigateur et OS complétés par le client | Proposé |
| GET | BFF Settings `/settings/system/logs` | Core `GET /api/v1/user/me/diagnostics/logs` | Export diagnostic limité à l'utilisateur, expurgé des secrets ; distinct des logs administrateur | Proposé |

## Points d'alignement

| Sujet | Contrat / écart |
| --- | --- |
| Actions locales / liens | Vider le cache n'efface pas les fichiers serveur. Centre d'aide, support et signalement sont des destinations de configuration à préciser ; aucune table métier déduite des boutons. |
| Compatibilité profil | Les anciennes routes de profil de Messagerie/E-learning ne deviennent pas des sources concurrentes. Elles devront déléguer au même Core ; aucune page front n'est déplacée par cette modification documentaire. |

## Sources

| Périmètre | Référence |
| --- | --- |
| Front inspecté | [src/app/page.tsx](src/app/page.tsx) |
| Identité / sessions / groupes | [Core_API 9904624](https://github.com/mairie360/Core_API/tree/99046240dd9742217d2a2c3d282721b785cacca0/src) ; [BFF_user b7c3477](https://github.com/mairie360/BFF_user/tree/b7c3477f858073aa846ba0129cbb29152528e6d2/src) |
| Données des composants partagés | [lib-components 88b339b](https://github.com/mairie360/lib-components/tree/88b339b77d06670b14b5f2f3d1f3d10ed471bb03/src/components/settings) |
