-- =============================================================================
-- Migration 0008: run on IST
--
-- VMI Collective operates from India, so the house timezone is Asia/Kolkata
-- (UTC+05:30) rather than UTC.
--
-- Only the display timezone changes. starts_at / ends_at are timestamptz and
-- stay stored as UTC instants, so this does not move any event in real time.
-- What changes is the wall-clock time the dashboard shows and accepts.
--
-- Asia/Kolkata is the canonical IANA name. Asia/Calcutta is a legacy alias for
-- the same zone; Postgres accepts both, and the UI now offers only the modern
-- name so the picker does not list the same zone twice.
--
-- Safe to run more than once.
-- =============================================================================

alter table public.events
  alter column timezone set default 'Asia/Kolkata';

-- Move anything still on the old UTC default. Events deliberately set to some
-- other zone are left alone.
update public.events
set timezone = 'Asia/Kolkata'
where timezone = 'UTC';

comment on column public.events.timezone is
  'IANA zone the event runs in. Wall-clock times in the UI are shown in this zone; starts_at / ends_at remain UTC instants.';

-- Check it worked. WWC should read Asia/Kolkata, and the times below are what
-- the dashboard will display.
select
  slug,
  name,
  timezone,
  starts_at,
  starts_at at time zone timezone as starts_local,
  ends_at   at time zone timezone as ends_local
from public.events
order by slug;
