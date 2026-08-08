-- RADAS V2 / User profile
-- Subscribers may update public profile fields without gaining access to role or plan.

revoke update on table public.profiles from authenticated;
grant update (full_name, avatar_url) on table public.profiles to authenticated;

create policy "profiles_update_own_public_fields"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
