> Mise à jour : les tarifs actuels et les huit offres payantes (dont CapCut Pro) figurent dans CATALOGUE-INITIAL-FINAL.md. Les anciens tarifs mentionnés ci-dessous sont historiques ; initial.json et 002_initial_catalogue.sql ont été régénérés selon la dernière demande. Aucun SQL exécuté sur Supabase.

# Visuels temporaires et remplacement depuis l'administration

Neuf illustrations originales locales, sans téléchargement de logos ou photos tiers. WebP 1200 × 750 (8:5), base bleu/violet, accent spécifique et pictogramme par service. Aucun asset officiel n'existait dans public. Sources SVG éditables dans public/services/source ; régénération : node scripts/generate-service-images.mjs.

| Service | Chemin |
|---|---|
| Netflix | /services/netflix.webp |
| Prime Video | /services/prime-video.webp |
| Disney+ | /services/disney-plus.webp |
| ChatGPT | /services/chatgpt.webp |
| Canva Pro | /services/canva-pro.webp |
| Spotify Premium | /services/spotify-premium.webp |
| CapCut Pro | /services/capcut-pro.webp |
| Monétisation TikTok | /services/monetisation-tiktok.webp |
| Logiciels informatiques | /services/logiciels-informatiques.webp |

Fallback général : /services/fallback.webp. products.image reste la source prioritaire ; une valeur vide ou une image qui échoue utilise l'illustration locale du service, puis le fallback général pour une nouvelle offre. Un dernier pictogramme reste disponible si même l'asset local échoue.

Le seed 002 est préparé avec les huit offres payantes et les tarifs corrigés à la demande du propriétaire, avec leurs chemins image. Aucun IPTV, Poutoulou ou prix gratuit. Les logiciels restent hors du seed jusqu'à décision de leur prix ; leur visuel est prêt. CapCut Pro est dans Création, à 6 500 FCFA, actif et commandable, sans promotion. Sa durée n'a pas été précisée : aucune durée d'abonnement n'est supposée. Aucun SQL exécuté sur Supabase.

## Remplacer une image

Administration → Services → Modifier le produit → Image actuelle → Modifier l’image → choisir un fichier → vérifier l’aperçu → Enregistrer le service. Possibilité d'annuler le remplacement avant sauvegarde. Les URL HTTPS et chemins locaux restent utilisables.

Formats : JPG, PNG, WebP ; 5 Mo maximum et 25 millions de pixels maximum à décoder. Le serveur vérifie la session et admins, décode l'image, refuse les fichiers invalides ou animés, la réduit à 1600 pixels maximum, retire les métadonnées et la convertit en WebP. Le nom de fichier envoyé par le navigateur n'est pas utilisé pour le chemin de stockage.

Chaque remplacement reçoit une nouvelle URL aléatoire : pas d'ancien contenu conservé par le cache. Ordre : upload du WebP → mise à jour de products.image avec contrôle de version updated_at → nettoyage de l'ancien fichier. Si le produit a changé entre-temps, la sauvegarde échoue et seul le nouveau fichier temporaire est supprimé ; l'image actuelle reste intacte.

L'ancien fichier est supprimé uniquement si son URL appartient au bucket service-images de ce projet, avec un chemin services/<UUID>.webp, et qu'aucun produit (même désactivé ou archivé) ne référence encore cette URL. Les assets locaux, images externes, autres buckets et images partagées sont conservés. Une erreur de vérification ou de suppression conserve l'ancienne image et affiche un avertissement ; la nouvelle image enregistrée reste utilisable.

Accueil, boutique, fiche et commande partagent le même chargeur products.image. Actualisation à la prochaine navigation ; les onglets visibles se rafraîchissent sous 30 secondes ou au retour du focus. Une erreur ne laisse pas d'image cassée.

## Supabase Storage : préparation uniquement

supabase/migrations/004_service_images_storage.sql prépare le bucket public service-images et ses politiques RLS, après 001–003. Aucun bucket ni policy créé dans Supabase réel. L'activation attend votre accord.

Le bucket est réservé aux images publiques de catalogue. Aucun identifiant, mot de passe, preuve de paiement ou document client ne doit y être stocké. Lecture des images via URL publique ; insertions et suppression de fichiers réservées aux admins. Les écrasements de fichiers sont refusés : chaque upload a une nouvelle URL. Les politiques restrictives protègent aussi contre d'anciennes politiques permissives et ne changent pas les autres buckets.

Le bucket autorise image/jpeg, image/png et image/webp, mais l'application stocke systématiquement du WebP : les photos JPG/JPEG, PNG et WebP sont réellement décodées puis réencodées par sharp avant l'appel Storage.upload, avec Content-Type image/webp et un nom UUID.webp. La regex INSERT .webp est donc conservée. Des tests vérifient les octets RIFF/WEBP et le format décodé pour les quatre extensions d'entrée.

Sans activation de Storage, les visuels locaux fonctionnent. Une tentative d'upload affiche une erreur explicite et conserve l'image actuelle ; les chemins locaux et URL restent sauvegardables.

L'aperçu npm run test:preview utilise un stockage en mémoire local avec les politiques PostgreSQL testées. Les URL /api/test-image/... sont réservées à TZ_LOCAL_TEST_PREVIEW=1 et retournent 404 hors de cet environnement. Aucune connexion à Supabase réel pendant ces essais.

## Vérification du 7 octobre 2026

Build et lint réussis ; 56 tests réussis, aucun échec. Logs : images-build.log, images-lint.log, products-tests.log.

Parcours navigateur local vérifié : aperçu du fichier sélectionné, upload et sauvegarde admin, nouvelle image chargée sur la fiche publique, fallback après chemin volontairement cassé, restauration du chemin initial. Les sept images du catalogue sont chargées à 390 et 1440 pixels sans débordement horizontal. Captures : images/cartes-mobile.jpg et images/cartes-desktop.jpg ; planche des neuf visuels : images/services-preview.png.

Références : [contrôle d'accès Storage](https://supabase.com/docs/guides/storage/security/access-control) et [buckets publics](https://supabase.com/docs/guides/storage/buckets/fundamentals).
