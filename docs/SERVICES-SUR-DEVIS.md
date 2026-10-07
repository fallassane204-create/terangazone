# Prestations sur devis

Les prestations Shooting photo, Création de site web et Vente de logiciels informatiques sont ajoutées depuis l’administration au catalogue `public.products`. Aucun tarif n’est publié : le prix applicatif est `null` et le champ existant `quote_only` distingue explicitement une demande de devis d’une offre gratuite. La valeur technique de stockage imposée par la colonne historique `price NOT NULL` n’est jamais affichée comme un prix gratuit.

Le bouton « Demander un devis » utilise le numéro WhatsApp configuré dans les paramètres, avec un message contenant le nom de la prestation. Il est visible sur les cartes de l’accueil, de la boutique et sur les fiches détaillées. Les demandes ne créent aucune commande ou transaction automatiquement. Les devis restent exclus du formulaire de commande à prix fixe et de l’enregistrement de paiement.

Dans l’administration, le prix reste vide et « Commandes WhatsApp autorisées » est décoché : ce réglage concerne les commandes directes avec prix. Une prestation active sans prix peut toujours recevoir une demande de devis. Les prestations désactivées ou archivées restent invisibles au public. Pour proposer ultérieurement un tarif fixe, renseigner un prix strictement positif et activer les commandes directes.

Les catégories existantes sont réutilisées : Création pour le shooting et les sites web, Logiciels pour les logiciels informatiques. Les images locales originales ont été générées avec l’outil intégré imagegen, puis optimisées en WebP paysage 1200 × 750 dans `public/services/paysage/`. Il s’agit de visuels illustratifs, pas de photographies des locaux réels. Les premiers visuels SVG et l’ancien visuel logiciels sont conservés. L’image peut être remplacée dans l’administration.

Un visuel `iptv.webp` est également préparé pour les cinq durées IPTV existantes, sans modifier leurs tarifs, promotions ni activation. Il n’est pas ajouté comme nouvelle prestation sur devis.

Les migrations déjà exécutées et le catalogue initial historique restent inchangés. Aucun seed n’est réexécuté et aucune offre existante n’est écrasée.
