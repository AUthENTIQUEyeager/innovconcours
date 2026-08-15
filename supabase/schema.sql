-- ============================================================
-- InnovConcours — Schéma Supabase (V1)
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- ---------- PROFILES ----------
-- Étend auth.users avec les infos du formulaire d'inscription
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null,
  prenom text not null,
  sexe text check (sexe in ('Feminin', 'Masculin')),
  ville text,
  whatsapp text,
  role text not null default 'apprenant' check (role in ('apprenant', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Un utilisateur ne peut lire/modifier que son propre profil
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- La création du profil se fait via un trigger (voir plus bas), pas d'insert direct client.

-- ---------- FORMATIONS ----------
-- Catalogue des concours/ministères avec leur tarif
create table if not exists public.formations (
  id uuid primary key default gen_random_uuid(),
  nom text not null,                    -- ex: "MEF", "MATM", "GÉNÉRALITÉS"
  type_concours text not null check (type_concours in ('Professionnel', 'Direct')),
  prix integer not null,                -- en F CFA
  description text,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.formations enable row level security;

-- Tout le monde (même non connecté) peut voir le catalogue actif — nécessaire pour la page publique
create policy "formations_select_public" on public.formations
  for select using (actif = true);

-- ---------- ENROLLMENTS ----------
-- Une tentative d'inscription à une formation par un apprenant
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  formation_id uuid not null references public.formations(id),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'paye', 'echoue', 'annule')),
  fusionpay_token text unique,          -- correspond au "token" retourné par FusionPay
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.enrollments enable row level security;

create policy "enrollments_select_own" on public.enrollments
  for select using (auth.uid() = user_id);

-- L'insertion se fait via la route API serveur (service_role), pas directement par le client,
-- pour garantir que le prix et le statut initial ne peuvent pas être falsifiés depuis le navigateur.

-- ---------- PAYMENTS ----------
-- Journal brut de chaque notification reçue de FusionPay (webhook + vérifications) — traçabilité en cas de litige
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  event text not null,                  -- payin.session.pending / completed / cancelled
  montant integer,
  frais integer,
  moyen text,                           -- orange / moov / etc.
  numero_transaction text,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments_select_own" on public.payments
  for select using (
    exists (
      select 1 from public.enrollments e
      where e.id = payments.enrollment_id and e.user_id = auth.uid()
    )
  );

-- Aucune policy insert/update pour le client : seule la route webhook (service_role,
-- qui contourne RLS) peut écrire ici. C'est volontaire — un paiement ne doit jamais
-- pouvoir être créé ou modifié depuis le navigateur.

-- ---------- ADMIN ACCESS ----------
-- Permet à un profil role='admin' de tout voir (utilisé par le tableau de bord admin)
create policy "profiles_select_admin" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "enrollments_select_admin" on public.enrollments
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "payments_select_admin" on public.payments
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------- TRIGGER : créer un profil automatiquement à l'inscription ----------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nom, prenom, sexe, ville, whatsapp)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce(new.raw_user_meta_data->>'prenom', ''),
    new.raw_user_meta_data->>'sexe',
    new.raw_user_meta_data->>'ville',
    new.raw_user_meta_data->>'whatsapp'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Données de départ : catalogue actuel (repris du site existant) ----------
insert into public.formations (nom, type_concours, prix, description) values
  ('MEF', 'Professionnel', 30000, 'Ministère de l''Économie et des Finances'),
  ('MATM', 'Professionnel', 30000, 'Ministère de l''Administration Territoriale'),
  ('MICA', 'Professionnel', 30000, 'Ministère de l''Industrie, du Commerce et de l''Artisanat'),
  ('MFPTPS', 'Professionnel', 30000, 'Ministère de la Fonction Publique'),
  ('MEEA', 'Professionnel', 30000, 'Ministère de l''Eau et de l''Assainissement'),
  ('MJDHRI', 'Professionnel', 30000, 'Ministère de la Justice'),
  ('GÉNÉRALITÉS', 'Direct', 15000, 'Préparation générale aux concours directs'),
  ('AF2026', 'Direct', 5000, 'Formation d''appui 2026')
on conflict do nothing;
