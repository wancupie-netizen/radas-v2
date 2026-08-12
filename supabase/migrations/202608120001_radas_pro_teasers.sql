-- RADAS PRO Teaser V1
-- Exposes only an allowlisted teaser projection for published PRO research.

create or replace function public.list_pro_research_teasers()
returns table (
  id uuid,
  product_name text,
  category text,
  platform text,
  price numeric,
  commission_amount numeric,
  product_image_path text,
  published_at timestamptz,
  content_angle_count integer,
  reference_video_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    research.id,
    research.product_name,
    research.category,
    research.platform,
    research.price,
    research.commission_amount,
    research.product_image_path,
    research.published_at,
    jsonb_array_length(coalesce(research.content_angles, '[]'::jsonb))::integer,
    jsonb_array_length(coalesce(research.reference_videos, '[]'::jsonb))::integer
  from public.researches as research
  where (select auth.uid()) is not null
    and research.status = 'published'
    and research.access_level = 'pro'
  order by research.published_at desc;
$$;

revoke all on function public.list_pro_research_teasers() from public;
revoke all on function public.list_pro_research_teasers() from anon;
grant execute on function public.list_pro_research_teasers() to authenticated;
