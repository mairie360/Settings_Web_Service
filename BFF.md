# Paramètres — routes BFF

| Méthode | Route BFF | Besoin du front | État |
|---|---|---|---|
| `GET` | `/settings/bootstrap` | Profil, sécurité, sessions, notifications, apparence, préférences et informations système | À créer |
| `PATCH` | `/settings/profile` | Nom, e-mail, téléphone, service, poste et biographie | À créer |
| `POST` | `/settings/profile/photo` | Photo de profil | À créer |
| `PATCH` | `/settings/password` | Changement du mot de passe connecté | À créer |
| `PATCH` | `/settings/security` | Double authentification SMS ou application | À créer |
| `DELETE` | `/settings/sessions/{sessionId}` | Déconnexion d’une session distante | À créer |
| `PATCH` | `/settings/notifications` | Canaux et types de notifications | À créer |
| `PATCH` | `/settings/appearance` | Thème, police, taille et densité | À créer |
| `PATCH` | `/settings/general` | Langue, fuseau, date, accueil et ouverture des notifications | À créer |
| `GET` | `/settings/system` | Version, navigateur, système et stockage utilisé | À créer |
| `GET` | `/settings/system/logs` | Téléchargement des journaux de support | À créer |
