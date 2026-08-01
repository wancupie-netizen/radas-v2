-- RADAS V2 / PC-010A
-- Creator context, user watchlists and future-editable video ideas.

alter table public.researches
  add column if not exists creator_count integer,
  add column if not exists video_ideas jsonb not null default '[]'::jsonb;

alter table public.researches
  drop constraint if exists researches_creator_count_check,
  add constraint researches_creator_count_check
    check (creator_count is null or creator_count >= 0),
  drop constraint if exists researches_video_ideas_check,
  add constraint researches_video_ideas_check
    check (jsonb_typeof(video_ideas) = 'array');

create table if not exists public.watchlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  research_id uuid not null references public.researches(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, research_id)
);

create index if not exists watchlists_user_created_idx
  on public.watchlists(user_id, created_at desc);

alter table public.watchlists enable row level security;

drop policy if exists "watchlists_select_own" on public.watchlists;
create policy "watchlists_select_own"
on public.watchlists for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "watchlists_insert_own" on public.watchlists;
create policy "watchlists_insert_own"
on public.watchlists for insert to authenticated
with check (
  user_id = (select auth.uid()) and
  exists (
    select 1 from public.researches
    where id = research_id and status = 'published'
  )
);

drop policy if exists "watchlists_delete_own" on public.watchlists;
create policy "watchlists_delete_own"
on public.watchlists for delete to authenticated
using (user_id = (select auth.uid()));

grant select, insert, delete on public.watchlists to authenticated;