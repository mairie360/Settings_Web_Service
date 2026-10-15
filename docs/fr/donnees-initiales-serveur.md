# Données initiales côté serveur — MAIR-526

Le document protégé Settings lit une fois le bootstrap publié au travers du SDK généré et du proxy BFF existant. L’origine publique configurée est validée ; la lecture utilise le cookie d’accès et `no-store`. Seules les données confirmées, validées et projetées sur les champs connus sont transmises au client. Aucun refresh token, en-tête de transport ni erreur privée amont n’est sérialisé.

Les données apparaissent dès le premier HTML et le montage client ne répète pas le bootstrap. Une clé opaque propre à chaque rendu serveur empêche la réutilisation des données d’une requête ou d’un compte précédent. Les reprises au retour au premier plan et la conservation des brouillons restent actives au sein de cette instance. Le `loading.tsx` local expose un état occupé nommé sans copier une primitive de bibliothèque non publiée.

Un accès absent ou expiré, une configuration invalide, une réponse incohérente, un refus HTTP ou une panne laissent les données initiales absentes. Le transport client de même origine assure alors la reprise habituelle ; le rendu serveur ne renouvelle et ne modifie aucun cookie. Les pages et états de chargement serveur restent mesurés par Node/c8, les interactions client par Vitest/V8, avec les seuils de 60 % existants et sans nouvelle exemption.

Les tests couvrent le véritable HTML serveur, le SDK et le proxy, l’isolation des requêtes concurrentes, les réponses invalides/refusées, l’hydratation sans lecture en double et la reprise au premier plan. La recette de laboratoire ne certifie ni la disponibilité du backend déployé ni la conformité RGAA complète.

Les formulaires natifs Settings utilisent explicitement POST. Avant hydratation, leur soumission ne peut pas sérialiser des données personnelles ou un secret dans une requête GET ; les gestionnaires hydratés conservent leur transport JSON de même origine. Une régression sur le HTML serveur vérifie la méthode native, et les tests de composants rendus couvrent le profil et les préférences. Aucune règle du scanner ni barrière de sécurité n’est assouplie.
