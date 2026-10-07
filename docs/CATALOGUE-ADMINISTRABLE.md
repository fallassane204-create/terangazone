> Mise à jour : les tarifs actuels et les huit offres payantes (dont CapCut Pro) figurent dans CATALOGUE-INITIAL-FINAL.md. Les anciens tarifs mentionnés ci-dessous sont historiques ; initial.json et 002_initial_catalogue.sql ont été régénérés selon la dernière demande. Aucun SQL exécuté sur Supabase.

# TerangaZone — catalogue administrable

Travail local dans `fix/stabilisation-terangazone`. Aucun déploiement, push, exécution SQL ou changement de données Supabase de production. Les tarifs initiaux et les coordonnées existantes sont conservés. Le fonctionnement connecté exige l'activation manuelle décrite dans [ACTIVATION-CATALOGUE.md](ACTIVATION-CATALOGUE.md).

## 1. Architecture trouvée

Application Next.js App Router, React, TypeScript, Tailwind, Supabase Auth et table `orders`. Le catalogue provenait de tableaux de pages publiques ; la commande et le catalogue pouvaient diverger. L'administration existante gère les commandes et leurs accès clients. Les variables de configuration restent dans l'environnement, jamais dans les paramètres publics.

L'inspection REST initiale a retourné HTTP 401. Le propriétaire a ensuite confirmé products vide et ses neuf colonnes, ainsi que admins (id UUID généré, email text NOT NULL, created_at). Le système est désormais adapté à ces tables existantes. Les 22 colonnes de orders et les noms orders_pkey / orders_order_number_key sont désormais confirmés par le propriétaire ; la migration les conserve.

## 2. Problèmes trouvés

Les anciennes sources étaient les listes dans `app/boutique/page.tsx` et `app/commande/page.tsx`, ainsi que les cartes de l'accueil `app/page.tsx`. Le précédent paiement avait aussi son parcours séparé. Leurs remplacements utilisent désormais le même catalogue. Les huit tarifs cohérents retrouvés sont Netflix 5 000, Prime Video 3 500, Disney+ 11 000, ChatGPT 6 500, Canva 15 000/an, Spotify 3 500, TikTok 15 000 FCFA et logiciels sur demande. **4 500 FCFA dans la demande était un exemple, pas un nouveau tarif accepté.** Aucun prix Poutoulou ni promotion n'a été inventé.

L'ancien `app/paiement/page.tsx` possédait lui aussi les sept tarifs payants, identiques ; il redirige maintenant vers la commande centrale. L'accueil avait des cartes de services mais pas de montants. Le zéro des anciens logiciels était un marqueur de devis, traduit explicitement en `null` ; il ne devient pas une gratuité. Les valeurs `initial.json` et `002_initial_catalogue.sql` généré sont les seules copies de bootstrap restantes. Aucune divergence monétaire n'a été trouvée entre les anciens tarifs payants.

Autres problèmes : absence de gestion centrale des paramètres, absence de fiches services, anciennes insertions de commande côté navigateur, risque de prix périmé et d'accès aux informations privées sous des politiques trop permissives. Les protections applicatives seules ne suffisent pas sans les politiques SQL.

## 3. Améliorations réalisées

Administration Services/Produits, prix rapide, éditeur complet, catégories, promotions, paramètres, archivage/restauration avec confirmation. Fiches `/services/[slug]`, catalogue filtrable, accueil partagé et commande dynamique. Gestion des dates, visibilité, durée, images, champs personnalisés, produits physiques et états vides/erreurs. Les doubles clics sont bloqués et les écritures concurrentes détectées par `updated_at`.

## 4. Fichiers modifiés

Cette phase ajoute ou remplace :

- Catalogue : `lib/catalogue/{types.ts,domain.ts,server.ts,products.ts,initial.json}` et `lib/admin-auth.ts`.
- Administration : `app/admin/catalogue-actions.ts`, `catalogue-ui.tsx`, `services/*`, `categories/*`, `promotions/*`, `parametres/*`, `page.tsx`, `orders-dashboard.tsx`, `admin-shell.tsx` et les informations supplémentaires dans `commandes/page.tsx`.
- Public : `app/page.tsx`, `boutique/{page.tsx,catalogue.tsx}`, `services/[slug]/*`, `commande/{page.tsx,order-form.tsx,actions.ts}`, `api/catalogue/revision/route.ts`, `components/{storefront.tsx,product-image.tsx,catalogue-refresh.tsx}`.
- Base et validation : `supabase/diagnostic-catalogue.sql`, `supabase/migrations/001_catalogue.sql`, `002_initial_catalogue.sql`, `003_register_admin.sql`, `scripts/{inspect-schema.mjs,generate-catalogue-seed.mjs,test-preview.mjs}`, `tests/catalogue*.test.mjs`, `tests/support/*`.
- Configuration : `package.json`, `package-lock.json`, `tsconfig.json`, documentation dans `docs/`.

La branche contient aussi les correctifs antérieurs de stabilisation sur connexion, paiement, commandes/clients, layout, CSS, proxy Supabase et renouvellements. Aucun de ces travaux n'a été annulé. Le [relevé exhaustif des fichiers](FICHIERS-MODIFIES.txt) liste les modifications encore non committées, y compris chaque nouveau fichier. La connexion dispose également d'une action serveur `app/connexion-admin/actions.ts` pour afficher un refus clair aux comptes ordinaires ; le proxy ne redirige pas ses POST avant cette vérification. Next.js 16.4 a automatiquement actualisé son bloc de consignes dans `AGENTS.md` lors du lancement de développement.

## 5. Nouveau fonctionnement des prix

Supabase est la source utilisée à chaque requête publique et chaque validation. `initial.json` ne sert qu'au bootstrap SQL et à un aperçu local explicitement activé ; le SQL généré n'est pas une seconde source à l'exécution. Une panne affiche un catalogue indisponible, sans ressusciter d'anciennes offres.

Sans ancien prix, `price` est le prix courant. Avec `old_price`, ce dernier est le tarif normal ; `price` est promotionnel uniquement si la promotion est activée et dans sa période. Début inclus, fin exclue, UTC/Dakar. Vide = sur devis, commandes désactivées ; un prix commandable doit être strictement positif. La base recalcule le prix et le total, conserve leur instantané dans la commande et refuse une offre ou des coordonnées devenues périmées. Une actualisation de page demande au client de confirmer les nouveaux montants avant la soumission.

## 6. Modifier un prix depuis l'admin

Se connecter sur `/connexion-admin`, ouvrir **Services**, rechercher le produit, changer le champ prix, puis **Enregistrer le prix**. L'éditeur **Modifier** permet les dates, description, image, champs de commande et disponibilité. Pour une remise : renseigner un prix normal supérieur, un prix promotionnel et activer la promotion. Les pages ouvertes détectent une nouvelle révision sous 30 secondes lorsqu'elles sont visibles, ou à la reprise du focus.

## 7. Tables Supabase utilisées

`products` existante comme unique catalogue, `orders` existante enrichie, `admins` existante pour les autorisations et `auth.users` pour l'identité. `categories` et `shop_settings` complètent les écrans déjà demandés. Aucun secret dans les paramètres publics. Aucun registre admin supplémentaire ni table services. L'adaptateur lib/catalogue/products.ts réutilise category, duration, image et active ; quote_only conserve price NOT NULL et identifie un devis non commandable ; details regroupe les options avancées déjà développées.

Les colonnes historiques attendues dans `orders` incluent `order_number`, `service_name`, `service_price`, `duration`, `customer_name`, `customer_phone`, `payment_method`, `payment_phone`, `payment_reference`, `status`, `created_at`, `paid_at`, `account_email`, `account_password`, `profile_name`, `expiration_date`, `access_message`, `internal_notes`, `delivered_at`, `renewed_at`, `renewal_count`. Vérifier leurs types et les autres contraintes réelles avant application. Les nouvelles colonnes sont `product_id`, `quantity`, `unit_price`, `customer_notes`, `order_fields`, `catalogue_snapshot`, `request_id`.

## 8. SQL à exécuter

Voir [la procédure complète](ACTIVATION-CATALOGUE.md). 001 enrichit products sans recréer products, orders ou admins ; 002 insère les offres actuelles sans doublon ni écrasement ; 003 inscrit fallassane204@gmail.com dans admins en utilisant email. Les trois fichiers sont idempotents, aucun exécuté sur Supabase. La réinscription admin ne nécessite aucune contrainte UNIQUE, conformément au schéma confirmé.

## 9. Sécurité et RLS

Chaque action serveur vérifie getUser, ADMIN_EMAIL et la présence de l'adresse Auth dans admins. admins.id reste un UUID de ligne indépendant du compte Auth. RLS limite le catalogue public aux produits et catégories actifs ; seules les sessions admin modifient le catalogue. Les rôles navigateur ne peuvent pas se donner des droits admin. Archivage réversible, commandes privées et protections restrictives contre d'anciennes politiques permissives. Aucun service_role côté navigateur.

L'insertion publique utilise exclusivement `tz_place_order`, fonction contrôlée à search_path fixe : prix recalculé, versions contrôlées, statut imposé, champs/quantités validés et idempotence par requête. Les mises à jour ne confirment une réussite que si une ligne a réellement changé. Les tests PostgreSQL vérifient ces propriétés ; il reste à les reproduire sur Supabase Auth et le schéma réel. Référence : [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 10. WhatsApp

Le message reprend le service validé, prix unitaire, quantité, total, durée, informations client, référence, champs utiles, livraison et numéro de commande enregistré. Les coordonnées proviennent des paramètres. Le texte est encodé correctement et le numéro normalisé. Un devis ou aperçu local passe par une demande de confirmation, sans prise de paiement ; une erreur d'enregistrement est annoncée clairement. Aucune conversation n'est envoyée automatiquement.

## 11. Mobile

Grilles adaptatives, formulaires lisibles, champs à 16 px, boutons accessibles, navigation admin mobile, tables dans des conteneurs défilants et contenus longs repliables. **112 contrôles navigateur : 16 états × 7 largeurs**, sans débordement horizontal mesuré. Largeurs effectivement vérifiées : 320, 360, 375, 390, 430, 768 et 1440 px. L'accueil a aussi été inspecté visuellement à 390 px.

États contrôlés : accueil, boutique, fiche ChatGPT, commande abonnement, connexion, dashboard, services/prix rapide, catégories, commandes, clients, promotions, paramètres, confirmation coordonnées, confirmation archivage, éditeur physique avec champ personnalisé et commande physique. Les menus admin mobiles et formulaires restent accessibles. Les champs de commande et de recherche affichent 16 px. Le défilement Next tient compte du `scroll-behavior` conformément au guide 16.4.

## 12. Build

`npm run build` réussi sous Next.js 16.4.0 : compilation, TypeScript et génération des 16 entrées terminées sans erreur. Pages catalogue et administration rendues dynamiquement.

## 13. Lint

`npm run lint` et `npx tsc --noEmit` réussis, sans erreur ; le build vérifie aussi TypeScript.

## 14. Tests

**56 tests réussis, zéro échec** après adaptation à products : règles métier, WhatsApp, tarifs initiaux, promotions, concurrence et renouvellements ; migrations/RLS exécutées uniquement dans PGlite local. Réexécution sans doublons, tarifs modifiés et produit préexistant conservés, inscription dans admins sans PK/UNIQUE, refus d'auto-attribution admin, renommage de catégorie, conversion des colonnes et message WhatsApp au prix actuel vérifiés. Comptes et commandes fictifs. Avertissement Node de détection ES module seulement.

Le navigateur a confirmé sur la base locale : connexion admin, refus non-admin et sans session, sauvegarde rapide de prix, promotion et prix barré sur accueil/catalogue/fiche/commande, actualisation d'une commande ouverte avec confirmation obligatoire et valeurs saisies conservées, enregistrement à 4 500 FCFA, message WhatsApp correctement encodé avec numéro de commande, retour du catalogue à 6 500 FCFA sans changer cet historique, archivage/retrait public puis restauration, paramètres dynamiques, confirmation des coordonnées, création de catégorie et produit physique avec image, stock, variante et adresse obligatoire. Quantité 2 × 1 000 = 2 000 FCFA vérifiée dans ce produit fictif. Aucun paiement ni message WhatsApp n'a été envoyé. L'aperçu a ensuite été réinitialisé pour supprimer les modifications d'essai et retrouver les sept offres payantes ; logiciels exclus en attendant leur prix. L'adaptateur Auth reste réservé aux tests et ne valide pas le service Supabase Auth réel.

## 15. Vérifications manuelles restantes

Restent : revue des définitions CHECK/NOT NULL historiques et application manuelle sur un Supabase de test avec de vrais comptes Auth. Les 22 colonnes, la PK et le UNIQUE de orders sont confirmés et conservés. products et admins sont adaptés aux structures confirmées par le propriétaire. Upload Storage préparé et testé localement, activation manuelle de 004 encore nécessaire ; stock manuel sans réservation/décrément, variantes comme offres distinctes et vérification manuelle des paiements.

Next.js et son lint ont été mis à jour de 16.2.11 vers 16.4.0, versions fixées dans le manifeste et le lockfile. Les guides installés de cette version ont été consultés. Les corrections compatibles `npm audit fix` ont aussi actualisé cinq dépendances transitives. **`npm audit --omit=dev` retourne zéro vulnérabilité.** L'audit complet garde cinq alertes élevées correspondant à une seule chaîne d'outillage : `braces → micromatch → fast-glob → @next/eslint-plugin-next → eslint-config-next`. Aucun correctif compatible n'est proposé pour cette chaîne au moment de l'audit. `--force` rétrograderait le lint à Next 14 : il n'a pas été utilisé. À suivre lors d'une prochaine publication de cet outillage. Références officielles des correctifs Next : [Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) et [Image/OG](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j).

## 16. Checklist avant production

- Diagnostiquer et sauvegarder la base ; adapter au schéma existant et vérifier les contraintes historiques.
- Exécuter et vérifier les migrations sur un projet Supabase de test, inscrire la bonne adresse dans admins.
- Tester avec visiteur, compte ordinaire et admin : catalogue public, refus des mutations, confidentialité des commandes.
- Valider les sept tarifs payants, dates, coordonnées et images ; décider le prix des logiciels ; garder `CATALOGUE_INITIAL_PREVIEW` désactivé.
- Essayer une commande, contrôler montant/WhatsApp et réception sans paiement réel pendant l'essai.
- Vérifier avec deux onglets un changement de prix et les anciennes commandes.
- Valider mobile, build, lint, tests et audit de dépendances.
- Déployer uniquement après votre validation ; aucune action de production n'a été effectuée ici.
