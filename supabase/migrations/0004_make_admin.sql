-- =============================================================================
-- Migration 0004: promote yourself to admin
--
-- Run this ONCE, after creating your own account in Authentication -> Users.
-- Replace the email below with yours before running.
--
-- Everyone else stays a 'member' until you promote them here or from the
-- Team page in the dashboard.
-- =============================================================================

update public.profiles
set role = 'admin'
where email = 'ajjitkumar@vmi-collective.in';

-- Check it worked. This should list you with role = admin.
select email, full_name, role, department from public.profiles order by created_at;
