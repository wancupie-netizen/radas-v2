-- RADAS V2 / PC-006A
-- Explicit Affiliate Playbook and editorial integrity metadata.

create type public.research_integrity as enum ('reviewed', 'limited_information', 'update_required');

alter table public.researches
  add column product_pain text,
  add column integrity_status public.research_integrity not null default 'limited_information',
  add column reference_videos jsonb not null default '[]'::jsonb check (jsonb_typeof(reference_videos) = 'array'),
  add column last_verified_at timestamptz;

alter table public.researches
  add constraint published_research_requires_integrity
  check (
    status <> 'published' or (
      product_pain is not null and
      last_verified_at is not null and
      integrity_status = 'reviewed'
    )
  );

drop policy if exists "research_admin_editor_update" on public.researches;

create policy "research_admin_update"
on public.researches for update to authenticated
using ((select public.current_user_role()) = 'admin')
with check ((select public.current_user_role()) = 'admin');

create policy "research_editor_update_unpublished"
on public.researches for update to authenticated
using (
  (select public.current_user_role()) = 'editor' and
  status not in ('published', 'archived')
)
with check (
  (select public.current_user_role()) = 'editor' and
  status not in ('published', 'archived')
);