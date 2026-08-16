create table public.research_access_settings (
  id smallint primary key default 1 check (id = 1),
  starter_daily_limit smallint not null default 5 check (starter_daily_limit between 1 and 50),
  activation_target integer not null default 20 check (activation_target between 1 and 10000),
  timezone text not null default 'Asia/Kuala_Lumpur' check (timezone = 'Asia/Kuala_Lumpur'),
  enforcement_enabled boolean not null default false check (enforcement_enabled = false),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.research_access_settings (id)
values (1)
on conflict (id) do nothing;

create table public.research_access_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  research_id uuid not null references public.researches(id) on delete cascade,
  access_date date not null,
  plan_snapshot public.subscription_plan not null,
  first_opened_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  open_count integer not null default 1 check (open_count > 0),
  primary key (user_id, research_id, access_date)
);

create index research_access_events_date_plan_idx
  on public.research_access_events (access_date, plan_snapshot);

create index research_access_events_research_date_idx
  on public.research_access_events (research_id, access_date);

alter table public.research_access_settings enable row level security;
alter table public.research_access_events enable row level security;

create or replace function public.record_research_access(p_research_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_role public.app_role;
  caller_plan public.subscription_plan;
  settings_row public.research_access_settings%rowtype;
  local_date date;
  used_count integer := 0;
  was_new boolean := false;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select role, plan into caller_role, caller_plan
  from public.profiles
  where id = caller_id;

  if caller_role is null or caller_plan is null then
    raise exception 'Profile not found';
  end if;

  if not exists (
    select 1
    from public.researches
    where id = p_research_id
      and status = 'published'
      and (
        access_level = 'free'
        or caller_plan = 'pro'
        or caller_role in ('admin', 'editor')
      )
  ) then
    raise exception 'Research is unavailable';
  end if;

  select * into settings_row
  from public.research_access_settings
  where id = 1;

  local_date := (now() at time zone settings_row.timezone)::date;

  if caller_role in ('admin', 'editor') then
    return jsonb_build_object(
      'plan', caller_plan,
      'used', 0,
      'limit', null,
      'remaining', null,
      'counted', false,
      'enforcement_enabled', false,
      'access_date', local_date
    );
  end if;

  insert into public.research_access_events (
    user_id, research_id, access_date, plan_snapshot
  ) values (
    caller_id, p_research_id, local_date, caller_plan
  )
  on conflict (user_id, research_id, access_date)
  do update set
    last_opened_at = now(),
    open_count = public.research_access_events.open_count + 1
  returning (xmax = 0) into was_new;

  select count(*)::integer into used_count
  from public.research_access_events
  where user_id = caller_id
    and access_date = local_date;

  return jsonb_build_object(
    'plan', caller_plan,
    'used', used_count,
    'limit', case when caller_plan = 'free' then settings_row.starter_daily_limit else null end,
    'remaining', case when caller_plan = 'free' then greatest(settings_row.starter_daily_limit - used_count, 0) else null end,
    'counted', was_new,
    'enforcement_enabled', false,
    'access_date', local_date
  );
end;
$$;

create or replace function public.get_research_access_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  settings_row public.research_access_settings%rowtype;
  local_date date;
  result jsonb;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = caller_id and role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  select * into settings_row
  from public.research_access_settings
  where id = 1;

  local_date := (now() at time zone settings_row.timezone)::date;

  with starter_usage as (
    select p.id, count(e.research_id)::integer as used
    from public.profiles p
    left join public.research_access_events e
      on e.user_id = p.id
      and e.access_date = local_date
    where p.role = 'subscriber' and p.plan = 'free'
    group by p.id
  ), top_research as (
    select r.id, r.slug, r.product_name, count(e.user_id)::integer as views
    from public.research_access_events e
    join public.researches r on r.id = e.research_id
    where e.access_date = local_date
    group by r.id, r.slug, r.product_name
    order by views desc, r.product_name asc
    limit 5
  )
  select jsonb_build_object(
    'date', local_date,
    'settings', jsonb_build_object(
      'starter_daily_limit', settings_row.starter_daily_limit,
      'activation_target', settings_row.activation_target,
      'timezone', settings_row.timezone,
      'enforcement_enabled', settings_row.enforcement_enabled
    ),
    'metrics', jsonb_build_object(
      'research_opened', (select count(*) from public.research_access_events where access_date = local_date),
      'active_starter', (select count(*) from starter_usage where used > 0),
      'at_limit', (select count(*) from starter_usage where used >= settings_row.starter_daily_limit),
      'active_pro', (
        select count(distinct e.user_id)
        from public.research_access_events e
        join public.profiles p on p.id = e.user_id
        where e.access_date = local_date and p.plan = 'pro' and p.role = 'subscriber'
      )
    ),
    'distribution', jsonb_build_object(
      'zero', (select count(*) from starter_usage where used = 0),
      'one_two', (select count(*) from starter_usage where used between 1 and 2),
      'three_four', (select count(*) from starter_usage where used between 3 and 4),
      'at_limit', (select count(*) from starter_usage where used >= settings_row.starter_daily_limit)
    ),
    'library', jsonb_build_object(
      'published_total', (select count(*) from public.researches where status = 'published'),
      'published_last_7_days', (
        select count(*) from public.researches
        where status = 'published' and published_at >= now() - interval '7 days'
      )
    ),
    'top_research', coalesce((select jsonb_agg(to_jsonb(top_research)) from top_research), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function public.update_research_access_settings(
  p_starter_daily_limit smallint,
  p_activation_target integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  updated_row public.research_access_settings%rowtype;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = caller_id and role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  if p_starter_daily_limit not between 1 and 50 then
    raise exception 'Starter daily limit must be between 1 and 50';
  end if;

  if p_activation_target not between 1 and 10000 then
    raise exception 'Activation target must be between 1 and 10000';
  end if;

  update public.research_access_settings
  set starter_daily_limit = p_starter_daily_limit,
      activation_target = p_activation_target,
      updated_at = now(),
      updated_by = caller_id
  where id = 1
  returning * into updated_row;

  return jsonb_build_object(
    'starter_daily_limit', updated_row.starter_daily_limit,
    'activation_target', updated_row.activation_target,
    'timezone', updated_row.timezone,
    'enforcement_enabled', updated_row.enforcement_enabled
  );
end;
$$;

revoke all on table public.research_access_settings from public, anon, authenticated;
revoke all on table public.research_access_events from public, anon, authenticated;

revoke all on function public.record_research_access(uuid) from public, anon, authenticated;
revoke all on function public.get_research_access_dashboard() from public, anon, authenticated;
revoke all on function public.update_research_access_settings(smallint, integer) from public, anon, authenticated;

grant execute on function public.record_research_access(uuid) to authenticated;
grant execute on function public.get_research_access_dashboard() to authenticated;
grant execute on function public.update_research_access_settings(smallint, integer) to authenticated;

comment on table public.research_access_events is
  'One row per user, research and Malaysia calendar day; repeat opens update open_count without consuming another unique view.';

comment on column public.research_access_settings.enforcement_enabled is
  'Locked false during observation phase. A later secure detail-gate migration must unlock enforcement.';
