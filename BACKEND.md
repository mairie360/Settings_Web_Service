# Backend — Paramètres

Correspondance front/BFF : [BFF.md](BFF.md). Référentiel de besoins harmonisé le 5 septembre 2026. Documentation uniquement : aucune route ni migration n'est créée par ces fichiers. Les chemins BFF sont relatifs au service indiqué, pas au préfixe des proxies Next.js ; les chemins backend conservent leurs préfixes réels.

`Existant` : déclaré dans les sources locales ; `Partiel` : route présente mais données manquantes, SQL direct ou mémoire ; `Client généré` : chemin observé dans le client installé, déploiement non vérifié ; `Proposé` : contrat cible à implémenter/valider. Pour les tables, `SQL observé` ne prouve pas qu'une migration est déployée.

Les tables sont des sources ou des besoins cibles, pas un script SQL. Les références interservices (`user_id`, `file_id`, etc.) sont logiques : elles n'imposent pas de clé étrangère entre bases distinctes. Les BFF doivent à terme passer par les API propriétaires ; les accès SQL directs et replis mémoire actuels sont signalés. Les permissions restent contrôlées par le serveur.

## Tables communes

| Table / source propriétaire | Clés et données nécessaires | État |
| --- | --- | --- |
| Core `users` | `id` ; `first_name`, `last_name`, `email`, `phone_number`, `status`, `is_archived`, `first_connect`. `password` reste exclusivement côté serveur | SQL observé |
| Core `roles`, `user_roles` | `roles.id`, `roles.name` ; association `user_roles(user_id, role_id)` vers `users.id` et `roles.id` | SQL observé |
| Core `groups`, `group_users` | `groups.id`, `owner_id`, `name`, `description` ; association `group_users(group_id, user_id)` ; nomenclature cible commune basée sur Core | SQL observé dans Core ; divergence `group_members` dans les BFF User/Calendar/Project à résoudre, pas une seconde table cible |
| Core `sessions` | `id`, `user_id`, `created_at`, `expires_at`, `device_info`, `ip_address`, `revoked_at` ; `token_hash` interne, jamais exposé. Dernière connexion dérivée des sessions, pas de la date courante | SQL observé ; vue `v_sessions` utilisée par Core |
| Core `user_profiles` | `user_id` unique vers `users.id` ; `avatar_file_id` vers Files `files.id`, `service_id` vers `services.id`, `position`, `biography` ; `address`, `city` seulement pour compatibilité des anciens profils | Proposé ; ne pas dupliquer identité, mot de passe ou rôles |
| Core `services` | `id`, `code` unique, `name`, `active` ; même annuaire pour Paramètres, Administration, Calendrier, contacts et membres de projets | Proposé ; distinct des groupes d'habilitation |
| Core `notifications` | `id`, `user_id`, `type`, `title`, `body`, `resource_type`, `resource_id`, `created_at`, `read_at` ; source du compteur commun | Proposé ; distinct des préférences `user_notification_settings` |

## Tables du module

| Table / source propriétaire | Clés et données nécessaires | État |
| --- | --- | --- |
| Core `user_security_settings` | `user_id` unique, méthodes MFA activées ; secrets chiffrés côté serveur uniquement | Proposé ; même table que Connexion |
| Core `user_notification_settings` | `user_id` unique ; booléens `email`, `push`, `desktop`, `messages`, `projects`, `calendar` | Proposé ; préférences, distinctes de `notifications` |
| Core `user_preferences` | `user_id` unique ; `theme`, `font_family`, `font_size`, `density`, `language`, `timezone`, `date_format`, `home_page`, `auto_open_notifications` | Proposé |
| Core `system_settings` | Politique globale MFA, durée de session et limites de connexion ; aucun changement par les préférences personnelles | Proposé ; même table que Administration |
| Files `files`, `storage_quotas` | `files.id`, `owner_id`, `storage_key`, `mime_type`, `size_bytes`, `deleted_at` ; quota unique par `user_id` ; `user_profiles.avatar_file_id` référence le fichier avatar | Proposé ; même stockage que Fichiers |
| Core `application_logs` | Source de diagnostic filtrée ; `id`, `level`, `source`, `message`, `user_id`, `ip_address`, `created_at` ; pas d'accès utilisateur à tous les logs | Proposé ; même table/source que Administration |
| Configuration de déploiement / client | Version et date de déploiement ; navigateur, OS, cache temporaire, autorisations de notifications et préférence de thème système côté client | Pas de table métier |

## Routes backend communes

| Méthode | Service et route backend | Tables / source | État |
| --- | --- | --- | --- |
| GET | Core `/api/v1/user/me/` | `users`, `roles`, `user_roles` ; cible : `user_profiles`, `services`, `sessions` | Existant ; enrichissement proposé (notamment `id`, absent de GetMeResponseView local) |
| PATCH | Core `/api/v1/user/me/` | `users` ; cible : `user_profiles` | Existant pour prénom, nom, e-mail, téléphone ; extension proposée pour le profil |
| GET | Core `/api/v1/groups/` | `groups`, `group_users` | Existant ; groupes de l'appelant |
| GET | Core `/api/v1/sessions/` | `sessions`, vue `v_sessions` | Existant ; sessions de l'appelant |
| GET | Core `/api/v1/sessions/history` | `sessions`, vue `v_sessions` | Existant ; historique de l'appelant |
| POST | Core `/api/v1/sessions/refresh` | `sessions` ; entrée `refresh_token` | Existant |
| POST | Core `/api/v1/sessions/revoke` | `sessions` ; entrée `refresh_token` | Existant ; ce n'est pas une révocation par `sessionId` |
| DELETE | Core `/api/v1/sessions/{sessionId}` | `sessions` ; session appartenant à l'appelant | Proposé pour la déconnexion d'un autre appareil, sans exposer son refresh token |
| GET | Core `/api/v1/services/` | `services` | Proposé ; annuaire unique |
| GET | Core `/api/v1/users/directory/` | `users`, `user_profiles`, `services`, `roles`, `user_roles`, `groups`, `group_users` | Proposé ; annuaire limité au périmètre autorisé |
| GET | Core `/api/v1/user/me/notifications/` | `notifications` ; filtre utilisateur connecté | Proposé |
| PATCH | Core `/api/v1/user/me/notifications/{notificationId}/read` | `notifications.read_at` ; filtre utilisateur connecté | Proposé |

## Routes backend du module

| Méthode | Service et route backend | Tables / source | État |
| --- | --- | --- | --- |
| POST | Core `/api/v1/user/me/avatar` | `user_profiles.avatar_file_id` ; upload délégué à Files | Proposé |
| POST | Files `/api/v1/files/` | `files` + stockage objet ; propriétaire utilisateur connecté | Proposé ; même route que Fichiers |
| PATCH | Core `/api/v1/user/me/password` | `users`, `sessions` selon politique de révocation | Proposé ; distinct du changement forcé de première connexion |
| GET | Core `/api/v1/user/me/security/` | `user_security_settings`, `system_settings` ; booleans uniquement | Proposé |
| POST | Core `/api/v1/user/me/security/enrollments` | Défi MFA temporaire, `user_security_settings` | Proposé |
| POST | Core `/api/v1/user/me/security/enrollments/{enrollmentId}/verify` | Défi MFA, `user_security_settings` | Proposé |
| DELETE | Core `/api/v1/user/me/security/{method}` | `user_security_settings`, `system_settings` | Proposé |
| GET, PATCH | Core `/api/v1/user/me/notification-settings/` | `user_notification_settings` | Proposé |
| GET, PATCH | Core `/api/v1/user/me/preferences/` | `user_preferences` | Proposé ; PATCH partiel préservant les autres sections |
| GET | Core `/api/v1/system/info` | Configuration du déploiement ; version, date | Proposé |
| GET | Files `/api/v1/files/storage/me` | `files`, `storage_quotas` ; somme size_bytes et quota par propriétaire | Proposé ; même route que Fichiers |
| GET | Core `/api/v1/user/me/diagnostics/logs` | `application_logs` filtrés par utilisateur et données autorisées | Proposé |

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
