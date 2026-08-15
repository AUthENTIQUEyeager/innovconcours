# InnovConcours — V1

Plateforme d'inscription et de paiement pour formations aux concours administratifs.
Next.js (App Router) + Supabase + FusionPay, pensée pour Vercel.

## ⚠️ À résoudre avant de coder l'intégration en production

**FusionPay n'autorise que les appels provenant d'IP enregistrées.** Leur documentation
est explicite : *"Only registered IP addresses will be allowed to access the API. Any
undeclared IP will be automatically blocked."*

Le problème : les fonctions serverless de Vercel (plan gratuit/standard) n'ont **pas d'IP
sortante fixe** — elle change à chaque exécution. Ça veut dire que l'appel qui crée le lien
de paiement (`createPaymentLink` dans `src/lib/fusionpay.ts`) risque d'être bloqué de façon
imprévisible une fois en production.

Deux solutions, à trancher avant la mise en ligne réelle :

1. **Demander à FusionPay** s'ils peuvent whitelister par nom de domaine plutôt que par IP,
   ou s'ils ont une politique différente pour les hébergeurs serverless (le plus simple si
   possible — à vérifier directement avec leur support).
2. **Passer par une IP sortante fixe** : soit l'option "Static IP" de Vercel (payante, plan
   Pro), soit un petit proxy relais (ex. une IP statique low-cost) par lequel transitent
   uniquement les appels vers FusionPay.

Tant que ce point n'est pas confirmé, considérer la création de paiement comme **non
garantie en production**, même si le code est fonctionnel en local.

## Stack

- **Frontend** : Next.js 14 (App Router), Tailwind CSS
- **Backend/DB/Auth** : Supabase (Postgres + Auth + Row Level Security)
- **Paiement** : FusionPay (Money Fusion) — liens de paiement + webhook
- **Hébergement** : Vercel (frontend + API routes) / Supabase (DB)

## Mise en route

```bash
npm install
cp .env.example .env.local
# remplir .env.local avec vos clés (voir ci-dessous)
npm run dev
```

### 1. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécuter le contenu de `supabase/schema.sql` — crée les tables,
   les policies RLS, le trigger de création de profil, et insère le catalogue de départ.
3. Copier `Project URL`, `anon public key` et `service_role key` (Project Settings > API)
   dans `.env.local`.
4. Pour donner les droits admin à un compte (ex. Renaud) : après sa première inscription,
   exécuter en SQL Editor :
   ```sql
   update public.profiles set role = 'admin' where id = 'UUID_DU_COMPTE';
   ```

### 2. FusionPay

1. Créer un compte sur [moneyfusion.net](https://moneyfusion.net).
2. Dans le dashboard > **API de paiement**, créer une application. Vous obtenez une URL
   d'API à mettre dans `FUSIONPAY_API_URL`.
3. Enregistrer l'IP sortante de votre serveur (voir l'avertissement en haut de ce document).
4. `NEXT_PUBLIC_SITE_URL` doit être votre domaine final — FusionPay exige que `return_url`
   pointe vers le domaine déclaré.

### 3. Déploiement

1. Pousser ce projet sur GitHub.
2. Sur [vercel.com](https://vercel.com), importer le repo, renseigner les variables
   d'environnement (les mêmes que `.env.local`), déployer.
3. Une fois le nom de domaine acheté, l'ajouter dans Vercel (Project Settings > Domains),
   puis mettre à jour `NEXT_PUBLIC_SITE_URL` et le `return_url` déclaré chez FusionPay.

## Comment le paiement est sécurisé

Le webhook FusionPay (`/api/webhooks/fusionpay`) **ne fait jamais confiance au contenu reçu**.
Aucune signature n'est documentée sur ces notifications, donc au lieu d'activer un compte
directement sur la base de l'événement reçu, le serveur :

1. lit uniquement le `tokenPay` du payload,
2. rappelle FusionPay lui-même (`checkPaymentStatus`) pour connaître le vrai statut,
3. n'active l'accès que sur la base de cette réponse indépendante.

La page de retour (`/paiement/retour`) fait la même vérification en filet de sécurité, au
cas où l'apprenant revienne sur le site avant que le webhook n'arrive.

Le prix d'une formation n'est jamais envoyé depuis le formulaire — la route
`/api/inscription` le relit en base à partir de l'identifiant de la formation, ce qui rend
impossible toute falsification du montant depuis le navigateur.

## Ce qui n'est PAS encore dans ce V1

Volontairement laissé pour une V2, pour rester dans le budget défini :

- Interface d'administration complète (le rôle `admin` existe déjà en base, l'écran reste à construire)
- Contenu des formations (vidéos/documents) — actuellement seul l'accès est géré, pas le contenu lui-même
- Emails transactionnels (confirmation de paiement, mot de passe oublié — Supabase Auth gère le flow de base)
- Notifications WhatsApp automatiques
- Certificats / attestations PDF automatiques
