-- =============================================================================
-- Migration 0006: make sure every account has a profile, and that you're admin
--
-- Run this if the event form is read-only, or if the Team page is missing
-- people who definitely have accounts.
--
-- Why this is needed: profiles rows are created by a trigger on auth.users. Any
-- account created BEFORE 0001_init.sql ran has no profile row, so the app sees
-- no role and treats that person as a member. 0004 then updated zero rows,
-- silently.
--
-- Safe to run more than once.
-- =============================================================================

-- 1. Give every auth user a profile.
insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 2. Keep emails in step with auth, in case one changed.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is distinct from u.email;

-- 3. Promote yourself. Change the email if this is not you.
update public.profiles
set role = 'admin'
where email = 'ajjitkumar@vmi-collective.in';

-- 4. Check. You should appear with role = admin.
--    If "admin_count" is 0, the email above matches no account. Run
--    "select email from auth.users;" and use exactly what you see there.
select
  (select count(*) from public.profiles where role = 'admin') as admin_count,
  (select count(*) from auth.users)                           as auth_users,
  (select count(*) from public.profiles)                      as profiles;

select id, email, full_name, role, department, is_active
from public.profiles
order by created_at;
