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

-- ---------- CATEGORIES ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  icone text, -- optional emoji or icon class
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Everyone can see categories (maybe only active? but we keep simple)
create policy "categories_select_public" on public.categories
  for select using (true);

-- Only admins can insert/update/delete
create policy "categories_admin_all" on public.categories
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Add categorie_id to formations
alter table public.formations
  add column if not exists categorie_id uuid references public.categories(id);

-- Optionally add index for performance
create index if not exists idx_formations_categorie_id on public.formations(categorie_id);

-- ---------- RESOURCES ----------
-- Table pour stocker les ressources pédagogiques (images, PDF)
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('image', 'pdf')),
  file_path text not null, -- chemin dans le bucket Supabase Storage
  category_id uuid references public.categories(id),
  formation_id uuid references public.formations(id),
  uploaded_by uuid not null references public.profiles(id),
  file_size integer, -- taille en bytes
  mime_type text, -- type MIME du fichier
  created_at timestamptz not null default now()
);

alter table public.resources enable row level security;

-- Tout le monde peut voir les ressources (à affiner par formation/paiement si nécessaire)
create policy "resources_select_public" on public.resources
  for select using (true);

-- Seuls les admins peuvent créer/modifier/supprimer des ressources
create policy "resources_admin_all" on public.resources
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Optionally add indexes for performance
create index if not exists idx_resources_category_id on public.resources(category_id);
create index if not exists idx_resources_formation_id on public.resources(formation_id);
create index if not exists idx_resources_uploaded_by on public.resources(uploaded_by);
create index if not exists idx_resources_type on public.resources(type);

-- ---------- POLLS (SONDAGES) ----------
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  description text,
  status text not null check (status in ('draft', 'published', 'closed')) default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

alter table public.polls enable row level security;

-- Tout le monde peut voir les sondages publiés
create policy "polls_select_published" on public.polls
  for select using (status = 'published');

-- Seulement les admins peuvent voir tous les sondages (pour l'admin panel)
create policy "polls_select_admin" on public.polls
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Seuls les admins peuvent créer/modifier/supprimer des sondages
-- (les routes /api/admin/sondages et les server actions utilisent la clé
-- service_role qui contourne RLS ; cette policy est une protection en
-- profondeur si jamais un appel passait par le client anon un jour)
create policy "polls_admin_write" on public.polls
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------- POLL OPTIONS ----------
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.poll_options enable row level security;

-- Tout le monde peut voir les options des sondages publiés
create policy "poll_options_select_published" on public.poll_options
  for select using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and p.status = 'published'
    )
  );

-- Seulement les admins peuvent gérer les options (pour l'admin panel)
create policy "poll_options_select_admin" on public.poll_options
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Seuls les admins peuvent créer/modifier/supprimer des options
create policy "poll_options_admin_write" on public.poll_options
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------- POLL VOTES ----------
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(poll_id, user_id) -- Contrainte pour empêcher le double vote
);

alter table public.poll_votes enable row level security;

-- Les utilisateurs peuvent voir leurs propres votes
create policy "poll_votes_select_own" on public.poll_votes
  for select using (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres votes.
-- Le double vote est déjà empêché par la contrainte unique(poll_id, user_id)
-- ci-dessus.
create policy "poll_votes_insert_own" on public.poll_votes
  for insert with check (auth.uid() = user_id);

-- Seulement les admins peuvent voir tous les votes (pour les résultats)
create policy "poll_votes_select_admin" on public.poll_votes
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------- INDEXES pour la performance ----------
create index if not exists idx_polls_status on public.polls(status);
create index if not exists idx_polls_created_by on public.polls(created_by);
create index if not exists idx_poll_options_poll_id on public.poll_options(poll_id);
create index if not exists idx_poll_votes_poll_id on public.poll_votes(poll_id);
create index if not exists idx_poll_votes_user_id on public.poll_votes(user_id);

-- ---------- RÉSULTATS AGRÉGÉS ----------
-- Renvoie uniquement des comptages par option (jamais les user_id
-- individuels) pour contourner proprement le fait que poll_votes_select_own
-- ne laisse chacun voir que son propre vote.
create or replace function public.get_poll_results(poll_id_param uuid)
returns table (option_id uuid, vote_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select pv.option_id, count(*)::bigint as vote_count
  from public.poll_votes pv
  join public.polls p on p.id = pv.poll_id
  where pv.poll_id = poll_id_param
    and p.status in ('published', 'closed')
  group by pv.option_id;
$$;

grant execute on function public.get_poll_results(uuid) to anon, authenticated;