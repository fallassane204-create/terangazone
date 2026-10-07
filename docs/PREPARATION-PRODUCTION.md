# Sauvegarde et déploiement autorisés

Le propriétaire confirme avoir exécuté manuellement les migrations 001–004. Aucun script de build, de déploiement ou de démarrage n'exécute ces migrations. Aucune modification de données Supabase réalisée pendant cette préparation.

Catalogue public : products, huit offres, images locales WebP ; Prime Video 5000 FCFA et ChatGPT normal 7500 / promotion 6500 dans le seed. Les prix réellement affichés viennent de Supabase. Services/prix/promotions/images administrables avec contrôle Auth/admins/RLS. Storage service-images : conversion WebP, 5 Mo maximum, remplacement sécurisé. Commandes et WhatsApp au prix recalculé côté serveur, sans divulguer les accès privés.

Récupération du mot de passe ajoutée : /mot-de-passe-oublie → e-mail Supabase → /auth/callback (PKCE) → /reinitialiser-mot-de-passe. Adresse de retour calculée depuis le domaine courant ; aucun localhost:3000 codé en dur. Aucun e-mail ni changement de mot de passe de production effectué pour les tests. L'adresse HTTPS /auth/callback doit être autorisée dans la configuration Auth existante ; aucune configuration Supabase modifiée ici.

Build et lint réussis ; 59 tests réussis. Tests SQL sur PGlite éphémère uniquement. Logs : deploiement-build.log, deploiement-lint.log, deploiement-tests.log. Aucun paiement, commande de production ou message WhatsApp d'essai créé.

Contrôle Git : .env*, .vercel, clés privées et certificats ignorés ; aucun fichier secret suivi. scripts/check-git-secrets.mjs compare les valeurs de clés locales aux fichiers candidats sans afficher les valeurs.

Dépôt : https://github.com/fallassane204-create/terangazone ; branche de production identifiée : main (dernier déploiement Production GitHub/Vercel au même SHA). URL publique existante : https://terangazone.vercel.app.
