-- RADAS V2 / PC-002
-- Core database, authorization and product-image storage foundation.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'editor', 'subscriber');
create type public.subscription_plan as enum ('free', 'pro');
create type public.research_status as enum ('draft', 'ai_generated', 'in_review', 'published', 'archived');
create type public.research_access as enum ('free', 'pro');
create type public.research_verdict as enum ('layak_diuji', 'perlu_dipantau', 'tidak_disyorkan');
create type public.generation_status as enum ('queued', 'running', 'completed', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role public.app_role not null default 'subscriber',
  plan public.subscription_plan not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.researches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  product_name text not null check (char_length(product_name) between 2 and 180),
  category text not null check (char_length(category) between 2 and 100),
  platform text not null check (char_length(platform) between 2 and 100),
  price numeric(12,2) not null check (price >= 0),
  commission_amount numeric(12,2) check (commission_amount is null or commission_amount >= 0),
  commission_rate numeric(7,4) check (commission_rate is null or commission_rate between 0 and 100),
  product_url text not null check (product_url ~ '^https?://'),
  official_description text not null,
  product_image_path text,
  research_snapshot text,
  verdict public.research_verdict,
  verdict_reason text,
  research_insight text,
  execution_playbook jsonb not null default '[]'::jsonb check (jsonb_typeof(execution_playbook) = 'array'),
  suitable_for text[] not null default '{}',
  content_angles jsonb not null default '[]'::jsonb check (jsonb_typeof(content_angles) = 'array'),
  status public.research_status not null default 'draft',
  access_level public.research_access not null default 'free',
  is_featured boolean not null default false,
  author_id uuid not null references public.profiles(id),
  reviewer_id uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_research_requires_review check (
    status <> 'published' or (
      reviewer_id is not null and
      published_at is not null and
      research_snapshot is not null and
      verdict is not null and
      research_insight is not null
    )
  )
);

create table public.research_generation_runs (
  id uuid primary key default gen_random_uuid(),
  research_id uuid not null references public.researches(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  status public.generation_status not null default 'queued',
  provider text,
  model text,
  prompt_version text not null default 'v1',
  input_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost_usd numeric(12,6) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index researches_status_published_idx on public.researches(status, published_at desc);
create index researches_category_idx on public.researches(category);
create index researches_platform_idx on public.researches(platform);
create index researches_author_idx on public.researches(author_id);
create index generation_runs_research_idx on public.research_generation_runs(research_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger researches_set_updated_at before update on public.researches
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.current_user_plan()
returns public.subscription_plan
language sql
stable
security definer set search_path = ''
as $$
  select plan from public.profiles where id = (select auth.uid());
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.current_user_plan() from public;
grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.current_user_plan() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.researches enable row level security;
alter table public.research_generation_runs enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.current_user_role()) = 'admin');

create policy "profiles_admin_update"
on public.profiles for update to authenticated
using ((select public.current_user_role()) = 'admin')
with check ((select public.current_user_role()) = 'admin');

create policy "research_select_by_entitlement"
on public.researches for select to anon, authenticated
using (
  (status = 'published' and (
    access_level = 'free' or
    (select public.current_user_plan()) = 'pro'
  )) or
  (select public.current_user_role()) in ('admin', 'editor')
);

create policy "research_admin_editor_insert"
on public.researches for insert to authenticated
with check (
  (select public.current_user_role()) in ('admin', 'editor') and
  author_id = (select auth.uid())
);

create policy "research_admin_editor_update"
on public.researches for update to authenticated
using ((select public.current_user_role()) in ('admin', 'editor'))
with check ((select public.current_user_role()) in ('admin', 'editor'));

create policy "research_admin_delete"
on public.researches for delete to authenticated
using ((select public.current_user_role()) = 'admin');

create policy "generation_staff_select"
on public.research_generation_runs for select to authenticated
using ((select public.current_user_role()) in ('admin', 'editor'));

create policy "generation_staff_insert"
on public.research_generation_runs for insert to authenticated
with check (
  (select public.current_user_role()) in ('admin', 'editor') and
  requested_by = (select auth.uid())
);

create policy "generation_admin_update"
on public.research_generation_runs for update to authenticated
using ((select public.current_user_role()) = 'admin')
with check ((select public.current_user_role()) = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "product_images_public_read"
on storage.objects for select to public
using (bucket_id = 'product-images');

create policy "product_images_staff_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images' and
  (select public.current_user_role()) in ('admin', 'editor')
);

create policy "product_images_staff_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'product-images' and
  (select public.current_user_role()) in ('admin', 'editor')
)
with check (
  bucket_id = 'product-images' and
  (select public.current_user_role()) in ('admin', 'editor')
);

create policy "product_images_admin_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'product-images' and
  (select public.current_user_role()) = 'admin'
);

grant usage on schema public to anon, authenticated;
grant select on public.researches to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert, update, delete on public.researches to authenticated;
grant update on public.profiles to authenticated;
grant select, insert, update on public.research_generation_runs to authenticated;