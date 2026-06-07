-- Backfill profiles for auth users created without the sign-up trigger,
-- and add a helper for invite lookups by email.

insert into public.profiles (id, name, email)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
  u.email
from auth.users u
where u.email is not null
  and not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

insert into public.user_settings (user_id)
select u.id
from auth.users u
where not exists (select 1 from public.user_settings s where s.user_id = u.id)
on conflict (user_id) do nothing;

create or replace function public.find_auth_user_by_email(p_email text)
returns table (id uuid, email text, name text)
language sql
security definer
set search_path = public, auth
stable
as $$
  select
    u.id,
    u.email::text,
    coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1))::text as name
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.find_auth_user_by_email(text) from public;
grant execute on function public.find_auth_user_by_email(text) to service_role;
