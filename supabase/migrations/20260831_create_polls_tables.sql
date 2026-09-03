-- ============================================================
-- InnovConcours — Migration pour les sondages (Phase 5)
-- ============================================================

-- ---------- POLLS ----------
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
-- ci-dessus ; pas besoin de la revérifier ici (et une sous-requête qui le
-- referait devrait qualifier soigneusement ses colonnes pour ne pas être
-- toujours vraie/toujours fausse par erreur de portée SQL).
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
-- Les policies RLS ci-dessus ne laissent un utilisateur voir que SON PROPRE
-- vote (poll_votes_select_own), pas ceux des autres — c'est voulu, pour ne
-- pas exposer qui a voté pour quoi. Mais la page publique de résultats a
-- besoin des totaux agrégés par option. Cette fonction, exécutée avec les
-- droits du propriétaire (security definer), renvoie uniquement des
-- comptages — jamais les user_id individuels — pour un sondage publié.
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