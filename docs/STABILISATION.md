# Rapport de stabilisation TerangaZone

Branche : fix/stabilisation-terangazone. État initial Git propre. Aucune fusion, aucun déploiement, aucun changement de secrets, aucune écriture de production réalisée par cet audit.

## 1. Problèmes trouvés

- Le paramètre service des liens boutique était ignoré : Netflix restait sélectionné pour toutes les commandes.
- /paiement écrivait dans localStorage alors que /commande écrivait dans Supabase. Les commandes paiement étaient invisibles depuis un autre appareil.
- Le tableau de bord admin utilisait également localStorage, avec des statistiques différentes des listes Supabase.
- WhatsApp était ouvert par window.open après une attente réseau : risque de blocage par le navigateur. Une panne Supabase empêchait le client de poursuivre.
- Nom composé uniquement d'espaces et téléphones invalides acceptés.
- Autorisation admin limitée au proxy ; requêtes et mutations admin effectuées directement depuis le navigateur.
- Adresse admin codée en dur dans le formulaire, distincte de ADMIN_EMAIL côté serveur.
- Cookies de session actualisés non recopiés sur les redirections du proxy.
- Erreur Supabase de déconnexion ignorée.
- Mutations admin pouvaient annoncer un succès alors qu'aucune ligne n'était modifiée.
- Renouvellement systématique de 1 mois, y compris abonnement annuel ; dépassement du dernier jour du mois.
- Métadonnées Next.js par défaut et langue anglaise.
- 8 erreurs ESLint initiales, notamment mises à jour synchrones dans les effets et navigation interne par balises a.
- Chargement de polices Google inutilisées par les styles Arial : build dépendant du réseau.

## 2. Corrections effectuées

Préselection du service, validation téléphone sans masquer ni reformater pendant la saisie, inputMode tel et taille de texte de 16 px, navigation WhatsApp dans l'onglet courant et lien de secours conservant le message. Un seul parcours de commande/paiement et un seul identifiant par soumission. Paiement et tableau de bord raccordés à Supabase. Contrôle serveur de session/admin dans le layout et dans chaque action de lecture, modification et suppression ; champs modifiables limités ; confirmation qu'une ligne a été affectée. Correction cookies et déconnexion. Renouvellement mensuel/annuel borné au dernier jour du mois et refus des services ponctuels. Navigation Link, corrections des effets React, headers pouvant revenir à la ligne, métadonnées françaises. Suppression des imports de polices Google inutilisées sans changer la police Arial effectivement utilisée.

## 3. Fichiers modifiés ou ajoutés

- app/admin/actions.ts (ajout)
- app/admin/admin-shell.tsx (ajout, interface extraite du layout)
- app/admin/layout.tsx
- app/admin/page.tsx
- app/admin/clients/page.tsx
- app/admin/commandes/page.tsx
- app/boutique/page.tsx
- app/commande/page.tsx
- app/connexion-admin/page.tsx
- app/globals.css
- app/layout.tsx
- app/page.tsx
- app/paiement/page.tsx
- lib/supabase/proxy.ts
- lib/renewal.ts (ajout)
- tests/renewal.test.mjs (ajout)
- docs/supabase-audit-readonly.sql (ajout)
- docs/STABILISATION.md (ce rapport)

## 4. WhatsApp

Numéro existant conservé : 221781108729. Ouverture réelle de la page WhatsApp vérifiée pour un devis, sans envoyer de message : service, nom, téléphone et notes présents ; caractères é & + ? correctement transmis. Les messages payants contiennent offre, tarif, durée, mode et numéro de paiement, nom, téléphone, numéro payeur, référence, notes et numéro de commande. Aucun test de commande payante n'a été envoyé à Supabase afin de respecter l'interdiction d'écrire en production. L'ouverture de l'application WhatsApp native et l'envoi final sur un téléphone physique restent à vérifier.

## 5. Mobile

Accueil, boutique, commande, paiement et connexion admin vérifiés dans le navigateur local à 320, 360, 375, 390, 430, 768 et 1280 px : aucun débordement horizontal mesuré. Préselection Disney+ et montant 11 000 FCFA vérifiés. Saisie téléphone avec indicatif et espaces vérifiée ; numéro invalide rejeté ; champ payeur obligatoire bloque l'envoi. Pas de test matériel iOS/Android, ni de test des pages admin authentifiées.

## 6. Admin

Accès anonyme /admin/commandes testé : redirection /connexion-admin avec retour conservé. Protection serveur ajoutée aux données et mutations, fondée sur getUser et ADMIN_EMAIL. Aucun secret administrateur côté client détecté. Aucun test de connexion réussie, déconnexion réelle ou CRUD authentifié réalisé : aucun identifiant fourni. La protection directe de la base dépend des politiques RLS, non vérifiées.

## 7. Supabase

Seule table utilisée : orders. Les colonnes attendues incluent order_number, customer_name, customer_phone, payment_phone, service_name, service_price, duration, payment_method, payment_reference, status, access_message, account_email, account_password, profile_name, expiration_date, internal_notes, delivered_at, paid_at, renewed_at, renewal_count, created_at et id. Aucune migration, aucun schéma SQL ni politique RLS versionné trouvé. Pas de Storage ni de maybeSingle dans le code initial ; les mutations corrigées utilisent maybeSingle pour vérifier la ligne affectée. Le client public insère encore les commandes ; les politiques doivent interdire SELECT/UPDATE/DELETE anonymes et encadrer strictement INSERT. Les champs account_password et internal_notes sont sensibles. Le déplacement du code admin côté serveur ne remplace pas RLS. Aucun SQL exécuté, aucune donnée consultée depuis le tableau de bord connecté. Script de diagnostic strictement SELECT fourni séparément ; sa sortie permettra d'établir un SQL correctif adapté, sans inventer les politiques.

## 8. Prix / offres

Tarifs conservés. Définis dans app/boutique/page.tsx, tableau products (ligne 6), et app/commande/page.tsx, tableau OFFERS (ligne 21). /paiement réutilise maintenant /commande.

| Offre | Prix | Durée |
| --- | ---: | --- |
| Netflix | 5 000 FCFA | 1 mois |
| Prime Video | 3 500 FCFA | 1 mois |
| Disney+ | 11 000 FCFA | 1 mois |
| ChatGPT | 6 500 FCFA | 1 mois |
| Canva Pro | 15 000 FCFA | 1 an |
| Spotify Premium | 3 500 FCFA | 1 mois |
| Monétisation TikTok | 15 000 FCFA | Service |
| Logiciels informatiques | Sur demande | Sur demande |

Aucun montant contradictoire ni ancienne promotion détecté dans les fichiers du projet. Duplication boutique/commande conservée pour ne pas modifier les décisions commerciales. Les prix des commandes historiques en base n'ont pas été comparés. Poutoulou poudre/miel, CapCut Pro et IPTV absents : aucune offre ou aucun tarif inventé.

## 9. Build

Dernier npm run build : code de sortie 0, Next.js 16.2.11, compilation et TypeScript réussis, 11 pages générées. Les premiers builds sandbox échouaient au téléchargement Google Fonts ; un build autorisé avec réseau a réussi. Les imports de polices inutilisées ont ensuite été retirés ; le dernier build réussit sans ce téléchargement.

## 10. Tests

- npm run lint : code de sortie 0, aucune erreur ou warning.
- npx tsc --noEmit : code de sortie 0.
- node --experimental-strip-types --test tests/renewal.test.mjs : 5 tests passés, 0 échec (fin de mois, annuel, expiré, service ponctuel, date invalide). Node affiche un avertissement sur le type de module du fichier TypeScript ; aucun échec.
- git diff --check : réussi.
- Navigation publique locale, préselection, validation, ouverture devis WhatsApp et refus admin anonyme vérifiés.
- Pas de suite de tests existante détectée avant intervention.

## 11. Problèmes et vérifications restants

- RLS et schéma réels non vérifiés : la sécurité directe Supabase ne peut pas être certifiée.
- Commandes payantes et CRUD admin doivent être testés sur une base de test.
- Les notes client restent incluses dans WhatsApp mais ne sont pas stockées dans orders : aucune colonne client_notes connue. Ne pas détourner internal_notes sans décision et schéma confirmé.
- Les anciennes commandes localStorage restent sur leur navigateur d'origine : aucune migration automatique ni suppression. Elles ne sont plus la source des statistiques.
- Absence de profil client, inscription, reset password, panier, historique client, gestion de catalogue admin, paramètres admin, PWA, manifest et service worker. Ce sont des fonctionnalités absentes, pas des parcours certifiés.
- Catalogue représenté par icônes texte : pas d'images produit, d'images distantes cassées ou d'optimisation d'images à effectuer. Le favicon existant reste celui du projet initial et peut nécessiter un remplacement de marque.
- Sessions admin non autorisées et erreurs réseau de Supabase doivent être testées sur environnement de test. Les formulaires ne sont pas une barrière contre des INSERT directs forgés : encadrer tarifs/statuts via RLS ou endpoint serveur adapté au schéma.
- Aucune vérification native iOS/Android, modale admin authentifiée ou stockage des accès réels effectuée.

## 12. Checklist avant production

1. Vérifier ADMIN_EMAIL côté serveur sans l'exposer publiquement.
2. Exécuter le diagnostic SQL SELECT séparé, inspecter RLS et colonnes ; vérifier qu'anon et un utilisateur ordinaire ne lisent aucun accès client et ne modifient/suppriment aucune commande.
3. Sur base de test, commander chaque offre depuis la boutique avec Wave puis Orange Money ; comparer offre, prix, durée, identifiant et messages reçus.
4. Tester échec réseau/Supabase et le lien WhatsApp de secours ; vérifier absence de double commande.
5. Tester nom vide/espaces, numéros locaux et internationaux, copier-coller, accents, + et & dans les notes, référence facultative.
6. Sur iPhone et Android physiques, vérifier saisie et clavier téléphone, tous les CTA, ouverture WhatsApp, retour au site et envoi de preuve.
7. Avec un compte admin de test, vérifier lecture/statistiques, modification, confirmation paiement, livraison, suppression confirmée, renouvellement mensuel/annuel et déconnexion. Avec un compte ordinaire, vérifier refus des pages et actions.
8. Vérifier modales et menu admin à toutes les largeurs demandées, ainsi que recherche et catégories boutique.
9. Décider des offres absentes, de la conservation des anciennes commandes locales, du stockage des notes client et du favicon.
10. Relancer build, lint, TypeScript et tests ; faire valider cette branche avant fusion et déploiement manuels.
