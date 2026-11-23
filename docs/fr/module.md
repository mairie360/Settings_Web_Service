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

- Formulaire de prénom, nom, e-mail et téléphone. Les champs portent les contraintes du contrat publié (noms de 64 caractères maximum sans `<` ni `>`, e-mail de 320 maximum, téléphone de 32 caractères maximum composé de chiffres, espaces, `.`, `-`, `(`, `)` et d’un `+` initial facultatif), avec un texte d’aide.
- Le changement d’adresse e-mail demande le mot de passe actuel (MAIR-511) : le champ n’apparaît que tant que l’adresse saisie diffère de l’adresse confirmée (comparaison sans espaces ni casse), est envoyé une fois comme `current_password`, n’est jamais conservé avec le profil et est vidé au retour à l’adresse initiale ou après une sauvegarde confirmée. Sans lui, la sauvegarde est refusée localement, sans appel réseau. Un refus du BFF est expliqué en français : une ligne par détail de validation libellée par son champ, un mot de passe actuel incorrect (403) et une adresse déjà utilisée (409) ont leur propre message.
- La sidebar Settings retrouve les liens de 44px et l’ombre latérale de la référence. Son empilement mobile reste sous le bouton Fermer du tiroir publié. Le profil court conforme au contrat conserve sa largeur naturelle : aucun champ non pris en charge n’est copié pour forcer une scrollbar ou une équivalence visuelle.
- La navigation commune et la page reprennent l’échelle racine de 17px et la police système du prototype. La navigation conserve les tailles standard des petits textes de la référence ; les labels agrandis du panneau Settings existant restent limités à ce panneau. Le header partagé conserve sa hauteur en rem (68px avec ce réglage par défaut), sans hauteur fixe imposée. Il s’agit uniquement de présentation : les préférences sauvegardées de police, thème et densité restent indisponibles.
- Onglets à icônes alignés sur le prototype (deux colonnes mobile, trois intermédiaires, six desktop), sélection blanche au texte bleu et coordonnées sur une/deux colonnes. Flèches, Home et End conservent la sélection et le focus ; les icônes décoratives ne changent pas les noms accessibles. Aucun champ fictif du profil de démonstration n’est ajouté.
- Confirmation de sauvegarde à partir du profil relu par le BFF.
- Une seule sauvegarde du profil à la fois : les quatre champs et le bouton sont verrouillés pendant l’attente, même après changement d’onglet. Un refus conserve le brouillon et permet de réessayer ; un succès affiche le profil renvoyé et libère les champs pour une nouvelle modification.
- Une réponse de sauvegarde réussie mais inexploitable ne confirme rien : le brouillon et l’identité confirmée restent intacts. La reprise explicite du bootstrap conserve les champs modifiés et l’erreur de sauvegarde indépendante, adopte les champs reçus non modifiés et ne répète jamais le PATCH. Seule une réponse de sauvegarde validée avance la référence confirmée utilisée par les lectures suivantes.
- Coque V2 (MAIR-851) : `AccessibleShell` de la lib 2.x, titre « Paramètres » avec la date du jour, six onglets dans l’ordre de la maquette (Profil, Sécurité, Sessions, Notifications, Apparence, Général) ; un ancien lien `?tab=system` ou `system-assistance` ouvre Profil. L’interface reste toujours en clair, quel que soit le thème enregistré. Avant tout profil confirmé, la page affiche le panneau de chargement, puis « Profil temporairement indisponible » avec « Réessayer » (la cause amont n’est jamais affichée). Les confirmations sont des toasts de la lib en haut à droite (5 s pour un succès, fermables, Échap).
- Onglet Profil V2 (MAIR-864) : une seule carte « Informations personnelles » (Prénom / Nom, E-mail / Téléphone), le mot de passe actuel quand l’e-mail change, « N champs modifiés. » avec Annuler (restaure les valeurs enregistrées) et Enregistrer. Les erreurs s’affichent sous le champ concerné (« Le prénom est obligatoire. », « Adresse invalide (ex. prenom.nom@mairie.fr). », « Saisissez un numéro au format 06 12 34 56 78. », refus du BFF champ par champ) avec le toast « Profil non enregistré », et le focus va au premier champ en erreur ; un autre refus donne le toast « Enregistrement impossible », la saisie est conservée. Photo, service, fonction et bio attendent leur contrat (MAIR-354, MAIR-443).
- Onglet Sécurité (MAIR-876) : mot de passe, puis « Double authentification » (MAIR-807 : état Activée / Désactivée et codes de secours restants ; activation par QR code et clé à recopier puis premier code, dix codes de secours affichés une seule fois avec copie et téléchargement et case « J’ai enregistré mes codes » obligatoire ; régénération des codes avec un code de l’application ; désactivation avec mot de passe et code ; « Votre mairie impose la double authentification. » quand Core refuse la désactivation) et « Passkeys » (MAIR-811 : liste avec gestionnaire et dates, création nommée par le navigateur, suppression après confirmation ; refus de la mairie et navigateur sans WebAuthn indiqués).
- Liste de sessions dans son propre onglet Sessions avec état d’indisponibilité distinct.

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

Notifications, Apparence et Général (MAIR-902, MAIR-912, MAIR-921) utilisent les trois opérations PATCH publiées. Un interrupteur, une liste (police, densité) ou le curseur de taille du texte (14 à 24 px, envoyé au relâchement) enregistre tout de suite et confirme par un toast ; un refus remet la valeur confirmée et affiche « Enregistrement impossible. ». « Langue et région » (langue, fuseau horaire, format des dates, page d’accueil) est un formulaire avec Annuler / Enregistrer et le nombre de champs modifiés. `null` vaut la valeur par défaut du compte. Une section indisponible affiche « Préférences indisponibles » avec « Réessayer » et verrouille ses contrôles, comme pendant une lecture au premier plan. L’onglet Système a été retiré (MAIR-851) : les mises à jour de l’instance sont gérées dans Administration. Les adaptateurs de préférences ne garantissent pas que les routes correspondantes soient déployées dans Core.


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


Accessibilité (MAIR-482)

Les régions de statut restent montées vides avant les annonces ; la confirmation de sauvegarde ne suit que la réponse serveur. Le chargement visible conserve son texte et une région persistante annonce la lecture.


## Direction visuelle commune — MAIR-547

DA claire option 1 : tokens et police communs, navigation accessible et contenu métier conservé. Voir la [recette visuelle](../qa/design-qa.md) pour les preuves, vérifications et limites RGAA.

### Sessions, mot de passe et alertes (MAIR-892, MAIR-876)

- Sessions : « Sessions actives » signale cet appareil (« Cet appareil », jamais déconnectable). Toute autre session active se ferme après une confirmation ; « Déconnecter les autres appareils » les ferme toutes sauf celle-ci et indique combien. « Historique des connexions » liste les sessions terminées ou expirées. Une session déjà terminée (404) ou la session de la page (409) est expliquée en français.
- Sécurité : le mot de passe se change par BFF_Settings (8 à 255 caractères, différent de l’actuel) ; un mot de passe actuel faux, trop de tentatives ou un nouveau mot de passe refusé sont expliqués en français, et Core ferme les autres sessions. « Alertes de connexion » envoie un e-mail à chaque nouvelle connexion.
- Notifications ajoute « Mises à jour de la plateforme » ; Général ajoute « Sauvegarde automatique des brouillons » (activée par défaut).

### Mise en page V2.1 (MAIR-1125)

- Un bandeau d’en-tête présente l’agent (nom, « Paramètres du compte », e-mail) sur tous les onglets et montre trois tuiles qui ouvrent leur onglet : double authentification (Activée / Désactivée), sessions actives, notifications activées. Elles suivent chaque changement.
- Les onglets sont une barre flottante qui reste en haut au défilement ; chaque panneau a son icône ; la barre « Annuler / Enregistrer » de Profil et de « Langue et région » reste visible.

- Sessions V2.1 (MAIR-1126) : quatre cartes au-dessus des listes (sessions actives, autres appareils connectés, sessions dans l’historique, localisation de cet appareil : « Non disponible », le BFF ne la fournit pas encore), et un clic sur une session ouvre son détail dans une fenêtre centrée, avec « Déconnecter cette session » pour une autre session active (confirmation au-dessus de la fenêtre).

- Cartes de réglage et score de protection (MAIR-1127) : chaque interrupteur montre son icône (les types de notification dans la couleur de leur module). L’onglet Sécurité commence par « Protection du compte » : un score sur trois (double authentification, alertes de connexion, au plus trois sessions actives) avec « Bien protégé », « Correct » ou « À renforcer », puis les appareils connectés et « Gérer », qui ouvre Sessions.
