# Settings_Web_Service — Présentation du module

[Documentation technique](technical.md) · [English](../en/module.md) · [README](../../README.md)

Permettre à l’utilisateur de modifier ses coordonnées et de consulter ses sessions. L’interface affiche explicitement les réglages qui ne sont pas encore disponibles.

## Public et utilité

Les utilisateurs gérant leur profil personnel.

Domaine fonctionnel: Paramètres personnels.

## Fonctions disponibles

- Formulaire de prénom, nom, e-mail et téléphone.
- Confirmation de sauvegarde à partir du profil relu par le BFF.
- Liste de sessions dans l’onglet Sécurité avec état d’indisponibilité distinct.
- Onglet Système : aide adaptée aux fonctions disponibles, téléchargements locaux de demande/signalement en texte et diagnostic navigateur minimal en JSON. Aucun envoi automatique.

## Parcours type

1. Charger `/settings/bootstrap`.
2. Modifier les coordonnées et transmettre `/settings/profile`.
3. Afficher le profil relu depuis Core et consulter les sessions disponibles.

## Place dans Mairie360

Dépôts associés: [BFF_Settings](https://github.com/mairie360/BFF_Settings).

Ce dépôt contient l’interface navigateur et ses adaptateurs Next.js. Le BFF associé fournit les données métier et coordonne leurs sources.

## Données et état actuel

Le profil vient de Core `/api/v1/user/me/`; les sessions viennent de `/api/v1/sessions/`. Les champs sont `first_name`, `last_name`, `email` et `phone`. Le schéma des sessions ne conserve que les informations affichables et retire les champs internes. Aucune préférence n’est stockée localement par le BFF.

## Périmètre et limites

Les préférences notifications, apparence et général restent indisponibles. Système fournit uniquement une assistance locale, pas des journaux serveur, informations de déploiement ou quotas de stockage. La sécurité affiche les sessions, sans gérer les autres réglages. Les adaptateurs de préférences ne garantissent pas que les routes correspondantes soient déployées dans Core.

Les brouillons de demande/signalement acceptent 1 à 5 000 caractères et restent en mémoire ; quitter Système ou recharger la page les efface. Un échec de téléchargement conserve le brouillon et permet de réessayer. Relisez les fichiers avant de les partager par votre canal habituel. Aucun profil ni session n’est ajouté automatiquement, aucun service de support n’est contacté. Le diagnostic contient seulement le nom du module, sa date de génération, les familles estimées du navigateur et du système et la disponibilité des URL d’objets. Il ne collecte ni user-agent brut, données de compte, cookies, stockage, adresse de page ou journaux. La détection des familles est indicative, pas un inventaire de l’appareil.

## Pour développer ou exploiter ce module

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.
