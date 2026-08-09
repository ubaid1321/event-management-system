-- =============================================================================
-- Migration 0007: review step, Marketing team, and task deletion by creators
--
-- Run after 0006_backfill_profiles.sql.
--
-- Adds:
--   * Marketing as a fifth team
--   * An 'in_review' status between in_progress and done
--   * reviewer_id / reviewed_at, so finished work goes to a named person
--   * Members may delete tasks they created (admins still delete anything)
--
-- The flow becomes:
--   todo -> in_progress -> in_review -> done
--                            |
--                            +-- reviewer sends it back to in_progress
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: drop whichever check constraint currently encodes an enum list.
--
-- The originals were written as inline column checks, so Postgres named them
-- itself. Guessing "<table>_<column>_check" and using DROP IF EXISTS would
-- silently do nothing on a name mismatch, leaving the old constraint in place
-- to reject the new values. So look the name up instead. `marker` is a literal
-- unique to the constraint we mean (e.g. 'content'), which keeps us from
-- dropping the unrelated checks that also mention the same column.
-- ---------------------------------------------------------------------------
create or replace function pg_temp.drop_enum_check(
  target_table regclass,
  marker text
)
returns void
language plpgsql
as $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = target_table
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%' || marker || '%'
  loop
    execute format('alter table %s drop constraint %I', target_table, constraint_name);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Marketing joins the roster
-- ---------------------------------------------------------------------------
select pg_temp.drop_enum_check('public.profiles', '''content''');
alter table public.profiles
  add constraint profiles_department_check
  check (
    department is null
    or department in ('content', 'design', 'analyst', 'developer', 'marketing')
  );

select pg_temp.drop_enum_check('public.tasks', '''content''');
alter table public.tasks
  add constraint tasks_department_check
  check (department in ('content', 'design', 'analyst', 'developer', 'marketing'));

-- ---------------------------------------------------------------------------
-- Review step
-- ---------------------------------------------------------------------------
alter table public.tasks
  add column if not exists reviewer_id uuid references public.profiles (id) on delete set null;

alter table public.tasks
  add column if not exists reviewed_at timestamptz;

alter table public.tasks
  add column if not exists review_note text;

comment on column public.tasks.reviewer_id is
  'Who checks the work once it reaches in_review. Required to leave in_progress.';

-- 'todo' appears only in the status enum check, not in the completion check.
select pg_temp.drop_enum_check('public.tasks', '''todo''');
alter table public.tasks
  add constraint tasks_status_check
  check (status in ('todo', 'in_progress', 'in_review', 'blocked', 'done'));

-- A task under review must name its reviewer, or it sits in nobody's queue.
alter table public.tasks
  drop constraint if exists tasks_review_has_reviewer;
alter table public.tasks
  add constraint tasks_review_has_reviewer
  check (status <> 'in_review' or reviewer_id is not null);

create index if not exists tasks_reviewer_idx
  on public.tasks (reviewer_id)
  where reviewer_id is not null;

-- Everyone's personal queue: "assigned to me and not finished".
create index if not exists tasks_assignee_open_idx
  on public.tasks (assignee_id, status)
  where status <> 'done';

-- ---------------------------------------------------------------------------
-- Keep completion and review timestamps honest
-- ---------------------------------------------------------------------------
create or replace function public.sync_task_completion()
returns trigger
language plpgsql
as $$
begin
  -- Entering review stamps when it arrived; leaving review clears it.
  if new.status = 'in_review' and old.status is distinct from 'in_review' then
    new.reviewed_at := null;
  end if;

  if new.status = 'done' and (old.status is distinct from 'done' or new.completed_at is null) then
    new.completed_at := coalesce(new.completed_at, now());
    new.completed_by := coalesce(new.completed_by, auth.uid());
    new.reviewed_at  := coalesce(new.reviewed_at, now());
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

-- Reviewers need to move tasks they are reviewing, even when the task is
-- neither assigned to nor created by them.
drop policy if exists "Staff update tasks" on public.tasks;
create policy "Staff update tasks"
  on public.tasks for update to authenticated
  using (
    public.is_admin()
    or assignee_id = (select auth.uid())
    or created_by  = (select auth.uid())
    or reviewer_id = (select auth.uid())
  )
  with check (
    public.is_admin()
    or assignee_id = (select auth.uid())
    or created_by  = (select auth.uid())
    or reviewer_id = (select auth.uid())
  );

-- Deleting was admin-only. People who raised a task in error should be able to
-- withdraw it, so creators may delete their own too. Everything else stays put.
drop policy if exists "Admins delete tasks" on public.tasks;
drop policy if exists "Delete own or any as admin" on public.tasks;
create policy "Delete own or any as admin"
  on public.tasks for delete to authenticated
  using (public.is_admin() or created_by = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Check it worked. Both rows should list the five teams, and the status row
-- should include in_review. If a list looks short, the old constraint survived.
-- ---------------------------------------------------------------------------
select
  conrelid::regclass as table_name,
  conname            as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conname in (
  'profiles_department_check',
  'tasks_department_check',
  'tasks_status_check',
  'tasks_review_has_reviewer'
)
order by table_name, constraint_name;
