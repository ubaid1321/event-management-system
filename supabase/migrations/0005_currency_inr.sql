-- =============================================================================
-- Migration 0005: price everything in Indian rupees
--
-- VMI Collective sells in INR, so the currency picker is gone from the UI and
-- the column now defaults to INR. The column itself stays, so adding a second
-- currency later is a UI change rather than a migration.
--
-- ticket_price_cents holds paise (₹1 = 100).
-- =============================================================================

alter table public.events
  alter column currency set default 'INR';

update public.events
set currency = 'INR'
where currency is distinct from 'INR';

comment on column public.events.ticket_price_cents is
  'Ticket price in paise. 25000 = ₹250.';
