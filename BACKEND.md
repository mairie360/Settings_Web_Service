# Paramètres — tables et routes backend

## Tables

| Table | Données utilisées par le front | État |
|---|---|---|
| `users` | Nom, e-mail, téléphone et statut | Existante |
| `user_profiles` | Avatar, service, poste et biographie | À créer |
| `sessions` | Appareil, navigateur, localisation, activité et révocation | Existante |
| `user_security_settings` | Double authentification SMS et application | À créer |
| `user_notification_settings` | E-mail, push, desktop, messages, projets et calendrier | À créer |
| `user_preferences` | Thème, police, densité, langue, fuseau, date et page d’accueil | À créer |
| `services` | Liste des services municipaux | À créer |

## Routes backend

| Méthode | Route backend | Tables ou source | État |
|---|---|---|---|
| `GET` | `/api/v1/user/me/` | `users`, `user_profiles` | Existante, à étendre |
| `PATCH` | `/api/v1/user/me/` | `users`, `user_profiles` | Existante, à étendre |
| `POST` | `/api/v1/user/me/avatar` | `user_profiles`, stockage objet | À créer |
| `PATCH` | `/api/v1/user/me/password` | `users`, `sessions` | À créer |
| `GET` | `/api/v1/user/me/security` | `user_security_settings` | À créer |
| `PATCH` | `/api/v1/user/me/security` | `user_security_settings` | À créer |
| `GET` | `/api/v1/sessions/` | `sessions` | Existante |
| `POST` | `/api/v1/sessions/revoke` | `sessions` | Existante |
| `GET` | `/api/v1/user/me/notifications` | `user_notification_settings` | À créer |
| `PATCH` | `/api/v1/user/me/notifications` | `user_notification_settings` | À créer |
| `GET` | `/api/v1/user/me/preferences` | `user_preferences` | À créer |
| `PATCH` | `/api/v1/user/me/preferences` | `user_preferences` | À créer |
| `GET` | `/api/v1/services` | `services` | À créer |
| `GET` | `/api/v1/user/me/storage` | Stockage utilisateur | À créer |
| `GET` | `/api/v1/system/info` | Métadonnées de déploiement | À créer |
| `GET` | `/api/v1/system/logs` | Journaux de support | À créer |
