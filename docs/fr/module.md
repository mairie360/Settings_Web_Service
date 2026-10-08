# Settings_Web_Service — Présentation du module

## Lectures bootstrap cohérentes — MAIR-456

Le front vérifie le profil consommé, le tableau de sessions, leurs types et la
disponibilité déclarée avant de remplacer les données confirmées. Une lecture
réussie mais malformée affiche une reprise lisible, jamais une erreur JavaScript
brute ni une fausse liste vide. Au chargement initial, les données restent
indisponibles ; en actualisation, identité confirmée, champs propres, dernières
saisies, onglet et erreurs indépendantes de sauvegarde/déconnexion sont conservés.
Un GET valide volontaire fusionne contre la référence confirmée inchangée,
sans rejouer une sauvegarde. Téléphone/révocation optionnels et repli des dates
textuelles invalides gardent leur sémantique actuelle. Routes, droits et API/BFF
restent inchangés.

## Reconnexion — MAIR-405

Un visiteur sans cookie ou avec une session expirée rejoint le Login configuré
avant l’affichage de Settings. Un401 pendant une lecture/enregistrement délègue
une seule fois au flux Login de déconnexion/reconnexion ; l’écriture refusée
n’est jamais rejouée automatiquement. Un403 ou une panne du service conserve le
brouillon et la reprise habituelle. Aucun succès par stockage local ni session
fictive n’est ajouté. Sans configuration Login valide, un état d’indisponibilité
contrôlé apparaît. Ce contrôle frontend ne certifie ni authenticité du jeton,
révocation serveur ni permissions déployées.

[Documentation technique](technical.md) · [English](../en/module.md) · [README](../../README.md)

Permettre à l’utilisateur de modifier ses coordonnées et de consulter ses sessions. L’interface affiche explicitement les réglages qui ne sont pas encore disponibles.

## Public et utilité

Les utilisateurs gérant leur profil personnel.

Domaine fonctionnel: Paramètres personnels.

## Fonctions disponibles

- Formulaire de prénom, nom, e-mail et téléphone.
- La sidebar Settings retrouve les liens de 44px et l’ombre latérale de la référence. Son empilement mobile reste sous le bouton Fermer du tiroir publié. Le profil court conforme au contrat conserve sa largeur naturelle : aucun champ non pris en charge n’est copié pour forcer une scrollbar ou une équivalence visuelle.
- La navigation commune et la page reprennent l’échelle racine de 17px et la police système du prototype. La navigation conserve les tailles standard des petits textes de la référence ; les labels agrandis du panneau Settings existant restent limités à ce panneau. Le header partagé conserve sa hauteur en rem (68px avec ce réglage par défaut), sans hauteur fixe imposée. Il s’agit uniquement de présentation : les préférences sauvegardées de police, thème et densité restent indisponibles.
- Onglets à icônes alignés sur le prototype (deux colonnes mobile, trois intermédiaires, six desktop), sélection blanche au texte bleu et coordonnées sur une/deux colonnes. Flèches, Home et End conservent la sélection et le focus ; les icônes décoratives ne changent pas les noms accessibles. Aucun champ fictif du profil de démonstration n’est ajouté.
- Confirmation de sauvegarde à partir du profil relu par le BFF.
- Une seule sauvegarde du profil à la fois : les quatre champs et le bouton sont verrouillés pendant l’attente, même après changement d’onglet. Un refus conserve le brouillon et permet de réessayer ; un succès affiche le profil renvoyé et libère les champs pour une nouvelle modification.
- Une réponse de sauvegarde réussie mais inexploitable ne confirme rien : le brouillon et l’identité confirmée restent intacts. La reprise explicite du bootstrap conserve les champs modifiés et l’erreur de sauvegarde indépendante, adopte les champs reçus non modifiés et ne répète jamais le PATCH. Seule une réponse de sauvegarde validée avance la référence confirmée utilisée par les lectures suivantes.
- Liste de sessions dans l’onglet Sécurité avec état d’indisponibilité distinct.
- Onglet Système : familles estimées du navigateur actuel et du système (MAIR-471), aide adaptée, téléchargements locaux de demande/signalement en texte et diagnostic minimal en JSON. Les versions navigateur/déploiement et quotas de la référence ne sont pas copiés ; une information inconnue ou inaccessible reste explicite. Aucun envoi automatique ni nouvel appel métier.

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

Les préférences notifications, apparence et général restent indisponibles. Système fournit uniquement une assistance locale, pas des journaux serveur, informations de déploiement ou quotas de stockage. Aide, support et signalement s’ouvrent dans des fenêtres modales nommées comme la référence ; le focus reste dans la fenêtre, Échap/Fermer la ferme et restitue le focus au déclencheur. Un échec conserve le brouillon pour reprise ; la préparation réussie ferme la fenêtre et annonce seulement le lancement du téléchargement. Une nouvelle demande démarre vide, sans envoi automatique. La sécurité affiche les sessions, sans gérer les autres réglages. Les adaptateurs de préférences ne garantissent pas que les routes correspondantes soient déployées dans Core.

Les brouillons de demande/signalement acceptent 1 à 5 000 caractères et restent en mémoire ; quitter Système ou recharger la page les efface. Un échec de téléchargement conserve le brouillon et permet de réessayer. Relisez les fichiers avant de les partager par votre canal habituel. Aucun profil ni session n’est ajouté automatiquement, aucun service de support n’est contacté. Le diagnostic contient seulement le nom du module, sa date de génération, les familles estimées du navigateur et du système et la disponibilité des URL d’objets. Il ne collecte ni user-agent brut, données de compte, cookies, stockage, adresse de page ou journaux. La détection des familles est indicative, pas un inventaire de l’appareil.

## Pour développer ou exploiter ce module

Le candidat composé reprise/confirmation du profil consomme UI0.6.10 publié.
La recette native réelle390x844 conserve les champs modifiés et l'erreur pendant
la reprise GET seule ; seul un profil retourné utilisable confirme la sauvegarde.
Les lectures suivantes actualisent les champs non modifiés par rapport à cette
confirmation sans perdre un nouveau brouillon. Le redémarrage du serveur jetable
et les réponses invalides/refusées déclarées ne prouvent pas la persistance
déployée. 150tests Node et41composants, types/contrat/lint/build passent localement ;
vraie CI requise, intégration et livraison locale exacte restent distinctes.

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.
