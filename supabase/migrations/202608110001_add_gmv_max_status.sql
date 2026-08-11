-- RADAS V1: structured TikTok Shop seller-support signal.

alter table public.researches
  add column if not exists gmv_max_status text not null default 'unknown';

alter table public.researches
  drop constraint if exists researches_gmv_max_status_check,
  add constraint researches_gmv_max_status_check
    check (gmv_max_status in ('confirmed_active', 'indicated', 'unknown', 'inactive'));
