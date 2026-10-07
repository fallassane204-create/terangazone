> Mise à jour : les tarifs actuels et les huit offres payantes (dont CapCut Pro) figurent dans CATALOGUE-INITIAL-FINAL.md. Les anciens tarifs mentionnés ci-dessous sont historiques ; initial.json et 002_initial_catalogue.sql ont été régénérés selon la dernière demande. Aucun SQL exécuté sur Supabase.

# Catalogue TerangaZone sur products

Version du 7 octobre 2026. Aucun SQL exécuté sur Supabase, aucun déploiement ni push.

## Schéma confirmé par le propriétaire

`public.products` existe et contient zéro ligne. Colonnes conservées : `id`, `name`, `description`, `category`, `price` integer NOT NULL, `duration`, `image`, `active`, `created_at`. `admins` possède `id` UUID généré, `email` text NOT NULL et `created_at` ; aucune PK ou contrainte UNIQUE n'est supposée. `orders` possède les 22 colonnes confirmées par le propriétaire, sa PK orders_pkey, son UNIQUE orders_order_number_key, ses CHECK/NOT NULL et RLS activé. Toutes ces colonnes et contraintes historiques sont conservées.

Le catalogue central est exclusivement `products`. Aucune table `services`, aucun second registre d'administrateurs. Le type TypeScript `Service` et les routes `/services` désignent les offres à l'écran ; ils ne correspondent plus à une table SQL.

## SQL préparé, ordre manuel

1. `supabase/migrations/001_catalogue.sql` : enrichissement de products, fonctions, contraintes, index, triggers et RLS. Préserve les tables historiques. Réutilise admins. Crée seulement les tables complémentaires `categories` et `shop_settings` si absentes, pour les écrans de catégories et paramètres déjà demandés.
2. `supabase/migrations/002_initial_catalogue.sql` : brouillon de sept offres payantes avec leurs visuels locaux, six catégories et une ligne de paramètres. Tarifs à valider avant insertion. Les produits sont protégés contre les doublons par UUID, slug et nom normalisé. Aucune mise à jour des produits déjà présents. Les insertions de catégories et paramètres utilisent ON CONFLICT DO NOTHING. Aucun IPTV, aucune offre gratuite ; logiciels hors seed jusqu'à décision du prix, CapCut Pro possède seulement son asset.
3. `supabase/migrations/003_register_admin.sql` : inscrit le compte Auth `fallassane204@gmail.com` dans admins. Ne crée pas de compte Auth, ne modifie pas de mot de passe.

Les trois fichiers sont idempotents pour le schéma pris en charge. 002 verrouille products pendant son initialisation pour éviter deux seeds concurrents. La migration 001 recrée uniquement ses propres politiques et triggers nommés, sans supprimer les anciennes politiques ni les données.

001 reconnaît l'administrateur en comparant admins.email à l'adresse du compte Auth identifié par auth.uid(). admins.id reste son UUID de ligne, indépendant de l'UUID Auth. 003 verrouille admins puis insère l'adresse seulement si elle est absente, sans tenir compte de la casse ni des espaces. Aucune contrainte UNIQUE nécessaire ni ajoutée à admins ; le diagnostic facultatif est fourni dans supabase/diagnostic-admins.sql. Les colonnes de orders utilisées par la RPC sont vérifiées avant les modifications ; leurs types et contraintes doivent également être relus dans le diagnostic.

## Colonnes ajoutées à products

- `old_price`, `promotion_enabled` : prix normal/barré et activation explicite.
- `is_featured`, `sort_order`, `slug` : mise en avant, ordre et adresse de fiche.
- `promo_starts_at`, `promo_ends_at` : période facultative de promotion.
- `updated_at` : actualisation et refus des sauvegardes ou commandes périmées.
- `quote_only` : identifie un devis non commandable tout en conservant price NOT NULL.
- `details` JSONB : conserve les fonctions avancées déjà développées (champs de commande, type physique, stock manuel, unité, variante, instructions, résumé, bouton et archivage), sans ajouter une colonne par option.

Les champs existants category, duration, image et active sont réutilisés. Aucun category_id, image_url, billing_period ou is_active ajouté à products. category reçoit une FK textuelle vers categories.name avec ON UPDATE CASCADE : renommer la catégorie conserve l'association. Cette FK est NOT VALID pour ne pas refuser d'éventuelles anciennes lignes atypiques. La vue privée product_order_data sert uniquement d'adaptation à la RPC ; elle lit products sans copier les données.

orders reçoit uniquement des colonnes additionnelles si absentes : product_id (FK products), quantity, unit_price, customer_notes, order_fields, catalogue_snapshot, request_id. Ses anciennes colonnes et valeurs restent intactes. service_price conserve le total historique de la commande ; aucune synchronisation des anciens prix avec products. orders_pkey et orders_order_number_key ne sont ni modifiées ni recréées.

La migration révoque les anciens droits de table et de colonne pour PUBLIC et anon, puis accorde les accès de table à authenticated sous RLS admin restrictive. Un compte ordinaire ne lit aucune commande, même si une ancienne politique permissive existe. account_email et account_password sont accessibles uniquement aux sessions admin de l'application ; la RPC publique renvoie seulement order_number, unit_price et total. Les privilèges TRUNCATE sont aussi retirés aux rôles navigateur.

Validation locale complétée par les tests d'images et Storage : voir IMAGES-SERVICES.md et products-tests.log. Les tests comparent les OID et définitions des contraintes originales et toutes les valeurs des 22 colonnes historiques après plusieurs exécutions. Ils vérifient les accès sensibles admin/non-admin/anon, les droits PUBLIC/par colonne, le refus des prix nuls, les WebP et les droits d'upload. Aucun SQL exécuté sur Supabase.

## Offres et prix recensés

| Offre | Tarif | Durée |
|---|---:|---|
| Netflix | 5 000 FCFA | 1 mois |
| Prime Video | 3 500 FCFA | 1 mois |
| Disney+ | 11 000 FCFA | 1 mois |
| ChatGPT | 6 500 FCFA | 1 mois |
| Canva Pro | 15 000 FCFA | 1 an |
| Spotify Premium | 3 500 FCFA | 1 mois |
| Logiciels informatiques | Sur demande | Sur demande |
| Monétisation TikTok | 15 000 FCFA | Service |

Sources : anciennes app/boutique/page.tsx, app/commande/page.tsx et app/paiement/page.tsx (git HEAD), ainsi que lib/catalogue/initial.json. Les pages actuelles utilisent déjà le chargeur central, désormais branché à products. L'ancien accueil présentait les offres sans prix ; paiement présentait les sept offres payantes aux mêmes tarifs.

4500 FCFA pour ChatGPT apparaît uniquement comme donnée de test de promotion. Aucun tarif public concurrent trouvé. Aucun produit logiciels inséré dans le seed en attendant votre prix. Son illustration est prête pour plus tard. Aucun service gratuit : les prix commandables doivent être strictement positifs. Un éventuel devis ajouté manuellement dans l'admin doit être explicitement non commandable ; le 0 technique imposé par price NOT NULL n'est jamais affiché comme un tarif.

## Vérification après activation manuelle sur un projet de test

Dans SQL Editor, vérifier les sept lignes payantes :

```sql
select name,price,quote_only,old_price,promotion_enabled,is_featured,sort_order,slug
from public.products order by sort_order;
```

Connecter le site au projet de test avec les variables Supabase correspondantes et ADMIN_EMAIL=fallassane204@gmail.com. Dans admin/services, ajouter un produit, modifier son nom et son prix, puis désactiver/réactiver. Contrôler accueil, boutique, fiche, commande et texte WhatsApp. Aucun envoi WhatsApp automatique : ne pas envoyer de paiement réel pour ces essais.

Tester une promotion avec prix normal supérieur et dates, puis son expiration. Le prix normal s'applique hors période ou lorsque promotion_enabled=false. L'instant de fin est exclusif. Les onglets visibles se rafraîchissent sous 30 secondes et au retour du focus ; un formulaire déjà ouvert demande confirmation si l'offre a changé.

Vérifier qu'un utilisateur ordinaire ne peut ni modifier products, ni s'inscrire dans admins, ni consulter les commandes privées. Les politiques restrictives bloquent aussi d'anciennes politiques permissives trop larges. Les opérations sensibles restent contrôlées côté serveur et par RLS.

## Essais exclusivement locaux

`npm test` utilise PostgreSQL/PGlite en mémoire, sans .env.local et sans réseau Supabase. `npm run test:preview` démarre cet environnement sur 127.0.0.1:3220 avec les comptes fictifs admin@example.test et client@example.test, mot de passe local-test-only. Aucun paiement réel ; la base est perdue à l'arrêt. Cet aperçu ne prouve pas la configuration Auth de votre projet réel.

`npm run catalogue:seed` génère uniquement 002 à partir du jeu initial et de l'adaptateur products. Il n'exécute pas de SQL. Après activation, les tarifs publics viennent de products, pas du fichier initial. Le mode CATALOGUE_INITIAL_PREVIEW=1 reste réservé à un aperçu local indicatif.

Stock manuel, sans décrément ni réservation automatique. Les paiements restent vérifiés manuellement.
