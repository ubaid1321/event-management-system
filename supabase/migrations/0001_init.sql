-- =============================================================================
-- VMI Collective Event Management System
-- Migration 0001: profiles, events, registrations
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query),
-- then run 0002_seed_wwc.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per dashboard user, mirrored from auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Dashboard users. Rows are created automatically when a user is added in Supabase Auth.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Mirror new auth users into profiles. Because public signup is disabled at
-- the project level, every auth user is one the team created deliberately.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text not null,
  tagline            text,
  description        text,
  status             text not null default 'planning'
                       check (status in ('planning', 'open', 'live', 'closed', 'archived')),
  starts_at          timestamptz,
  ends_at            timestamptz,
  -- VMI Collective runs on IST. Times in the UI are wall-clock in this zone;
  -- starts_at / ends_at stay UTC instants.
  timezone           text not null default 'Asia/Kolkata',
  venue_name         text,
  venue_address      text,
  city               text,
  country            text,
  capacity           integer check (capacity is null or capacity >= 0),
  -- Price in paise: 25000 = ₹250.
  ticket_price_cents integer not null default 0 check (ticket_price_cents >= 0),
  currency           text not null default 'INR',
  website_url        text,
  contact_email      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint events_dates_ordered check (
    starts_at is null or ends_at is null or ends_at >= starts_at
  )
);

comment on column public.events.status is
  'planning = not announced, open = registration open, live = happening now, closed = registration closed, archived = done.';

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- registrations
-- ---------------------------------------------------------------------------
create table if not exists public.registrations (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events (id) on delete cascade,
  full_name         text not null,
  email             text not null,
  phone             text,
  organization      text,
  role_title        text,
  country           text,
  ticket_type       text not null default 'standard',
  status            text not null default 'pending'
                      check (status in ('pending', 'confirmed', 'waitlisted', 'cancelled')),
  amount_paid_cents integer not null default 0 check (amount_paid_cents >= 0),
  checked_in_at     timestamptz,
  notes             text,
  registered_at     timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint registrations_unique_email_per_event unique (event_id, email)
);

create index if not exists registrations_event_status_idx
  on public.registrations (event_id, status);

create index if not exists registrations_registered_at_idx
  on public.registrations (event_id, registered_at desc);

drop trigger if exists registrations_set_updated_at on public.registrations;
create trigger registrations_set_updated_at
  before update on public.registrations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- This is an internal dashboard: any signed-in user is staff and may read and
-- write event data. Anonymous requests get nothing. Tighten to role = 'admin'
-- here if you later add non-admin accounts.
-- ---------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.events        enable row level security;
alter table public.registrations enable row level security;

drop policy if exists "Staff read profiles"   on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
create policy "Staff read profiles"
  on public.profiles for select to authenticated using (true);
create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Staff manage events" on public.events;
create policy "Staff manage events"
  on public.events for all to authenticated using (true) with check (true);

drop policy if exists "Staff manage registrations" on public.registrations;
create policy "Staff manage registrations"
  on public.registrations for all to authenticated using (true) with check (true);
