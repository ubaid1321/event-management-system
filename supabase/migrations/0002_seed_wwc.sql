-- =============================================================================
-- Migration 0002: create the one event we currently run.
--
-- Deliberately minimal. Dates, venue, capacity and pricing are left empty;
-- fill them in on the Event page in the dashboard, which writes back to this
-- row. Nothing here is invented, so the dashboard never shows a number that
-- isn't real.
--
-- Re-running this file is safe: it will not overwrite anything you have set.
-- =============================================================================

insert into public.events (slug, name, status, timezone)
values ('wwc', 'World Wisdom Connect', 'planning', 'UTC')
on conflict (slug) do nothing;
