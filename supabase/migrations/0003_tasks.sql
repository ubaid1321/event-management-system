-- =============================================================================
-- Migration 0003: people, departments and tasks
--
-- Run after 0001_init.sql and 0002_seed_wwc.sql.
--
-- Adds:
--   * profiles.department  : Content / Design / Analyst / Developer
--   * tasks                : assigned work with a deliverable link
--
-- Roles:
--   admin  : assigns work, edits and deletes any task, manages the event
--   member : adds tasks, updates and completes tasks assigned to them
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles: which team someone is on
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists department text
    check (department is null or department in ('content', 'design', 'analyst', 'developer'));

alter table public.profiles
  add column if not exists title text;

alter table public.profiles
  add column if not exists is_active boolean not null default true;

comment on column public.profiles.department is
  'Which team this person works on. Null for admins who span all teams.';

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events (id) on delete cascade,

  title           text not null check (length(trim(title)) > 0),
  description     text,

  department      text not null default 'content'
                    check (department in ('content', 'design', 'analyst', 'developer')),
  status          text not null default 'todo'
                    check (status in ('todo', 'in_progress', 'blocked', 'done')),
  priority        text not null default 'normal'
                    check (priority in ('low', 'normal', 'high')),

  assignee_id     uuid references public.profiles (id) on delete set null,
  created_by      uuid references public.profiles (id) on delete set null,

  due_on          date,

  -- Where the finished work lives: a Drive folder, Figma file, doc, repo…
  deliverable_url text,
  deliverable_label text,

  completed_at    timestamptz,
  completed_by    uuid references public.profiles (id) on delete set null,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- A task is done exactly when it has a completion timestamp.
  constraint tasks_done_has_timestamp check (
    (status = 'done' and completed_at is not null)
    or (status <> 'done' and completed_at is null)
  )
);

create index if not exists tasks_event_status_idx
  on public.tasks (event_id, status);

create index if not exists tasks_event_department_idx
  on public.tasks (event_id, department);

create index if not exists tasks_assignee_idx
  on public.tasks (assignee_id) where assignee_id is not null;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Keep completed_at in lockstep with status so no client can desync them.
create or replace function public.sync_task_completion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and (old.status is distinct from 'done' or new.completed_at is null) then
    new.completed_at := coalesce(new.completed_at, now());
    new.completed_by := coalesce(new.completed_by, auth.uid());
  elsif new.status <> 'done' then
    new.completed_at := null;
    new.completed_by := null;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_sync_completion on public.tasks;
create trigger tasks_sync_completion
  before insert or update on public.tasks
  for each row execute function public.sync_task_completion();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.tasks enable row level security;

-- Helper: is the caller an admin? SECURITY DEFINER so the policy can read
-- profiles without recursing through the profiles policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Everyone signed in sees the whole board. Small collective, so the teams need
-- to see each other's work to coordinate.
drop policy if exists "Staff read tasks" on public.tasks;
create policy "Staff read tasks"
  on public.tasks for select to authenticated using (true);

-- Anyone may add a task, but only as themselves.
drop policy if exists "Staff create tasks" on public.tasks;
create policy "Staff create tasks"
  on public.tasks for insert to authenticated
  with check (created_by = (select auth.uid()) or public.is_admin());

-- Admins edit anything. Members edit tasks they own or created, which is
-- what lets them move their own work along and attach the deliverable link.
drop policy if exists "Staff update tasks" on public.tasks;
create policy "Staff update tasks"
  on public.tasks for update to authenticated
  using (
    public.is_admin()
    or assignee_id = (select auth.uid())
    or created_by = (select auth.uid())
  )
  with check (
    public.is_admin()
    or assignee_id = (select auth.uid())
    or created_by = (select auth.uid())
  );

-- Deleting is an admin action. Members close tasks, they do not erase them.
drop policy if exists "Admins delete tasks" on public.tasks;
create policy "Admins delete tasks"
  on public.tasks for delete to authenticated
  using (public.is_admin());

-- Admins maintain the roster (department, role, active).
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Only admins change the event record.
drop policy if exists "Staff manage events" on public.events;
drop policy if exists "Staff read events" on public.events;
drop policy if exists "Admins write events" on public.events;
create policy "Staff read events"
  on public.events for select to authenticated using (true);
create policy "Admins write events"
  on public.events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
