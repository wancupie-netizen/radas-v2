alter table public.announcements
add column recipient_user_id uuid references public.profiles(id) on delete cascade;

create index announcements_recipient_idx
on public.announcements (recipient_user_id, published_at desc)
where recipient_user_id is not null;

drop policy "Users can view eligible announcements" on public.announcements;

create policy "Users can view eligible announcements" on public.announcements
for select to authenticated using (
  (select public.current_user_role()) = 'admin'
  or (
    status = 'published'
    and published_at <= now()
    and (expires_at is null or expires_at > now())
    and (
      recipient_user_id = (select auth.uid())
      or (
        recipient_user_id is null
        and (
          audience = 'all'
          or (audience = 'starter' and (select public.current_user_plan()) = 'free')
          or (audience = 'pro' and (select public.current_user_plan()) = 'pro')
        )
      )
    )
  )
);

create or replace function public.create_welcome_announcement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'subscriber' then
    insert into public.announcements (
      title,
      body,
      type,
      audience,
      action_label,
      action_url,
      is_pinned,
      status,
      published_at,
      recipient_user_id,
      created_by
    ) values (
      'Selamat datang ke RADAS',
      'Akaun anda sudah bersedia. Mulakan dengan meneroka Research Library, fahami verdict RADAS dan simpan research yang sesuai untuk diuji.',
      'info',
      'all',
      'Terokai Research Library',
      '/research',
      false,
      'published',
      now(),
      new.id,
      new.id
    );
  end if;

  return new;
end;
$$;

revoke all on function public.create_welcome_announcement() from public, anon, authenticated;

create trigger profiles_create_welcome_announcement
after insert on public.profiles
for each row execute function public.create_welcome_announcement();
