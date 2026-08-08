create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  body text not null check (char_length(body) between 3 and 4000),
  type text not null default 'info' check (type in ('info', 'update', 'important')),
  audience text not null default 'all' check (audience in ('all', 'starter', 'pro')),
  action_label text,
  action_url text check (action_url is null or action_url ~ '^(https?://|/)'),
  is_pinned boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create table public.announcement_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

create index announcements_feed_idx on public.announcements (status, published_at desc);
create index announcements_audience_idx on public.announcements (audience, expires_at);
create index announcement_reads_user_idx on public.announcement_reads (user_id, read_at desc);

create trigger announcements_set_updated_at before update on public.announcements
for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;

create policy "Users can view eligible announcements" on public.announcements
for select to authenticated using (
  (select public.current_user_role()) = 'admin'
  or (
    status = 'published'
    and published_at <= now()
    and (expires_at is null or expires_at > now())
    and (
      audience = 'all'
      or (audience = 'starter' and (select public.current_user_plan()) = 'free')
      or (audience = 'pro' and (select public.current_user_plan()) = 'pro')
    )
  )
);

create policy "Admins can create announcements" on public.announcements
for insert to authenticated with check ((select public.current_user_role()) = 'admin' and created_by = (select auth.uid()));
create policy "Admins can update announcements" on public.announcements
for update to authenticated using ((select public.current_user_role()) = 'admin') with check ((select public.current_user_role()) = 'admin');
create policy "Admins can delete announcements" on public.announcements
for delete to authenticated using ((select public.current_user_role()) = 'admin');

create policy "Users can view own announcement reads" on public.announcement_reads
for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can mark own announcements read" on public.announcement_reads
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.announcements where id = announcement_id)
);

grant select, insert, update, delete on public.announcements to authenticated;
grant select, insert on public.announcement_reads to authenticated;
