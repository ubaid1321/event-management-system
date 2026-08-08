# VMI Collective — Event Management

Internal dashboard for running VMI Collective events. Currently tracking one:
**World Wisdom Connect (WWC)**.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth).

---

## What's in it

| Page | Path | What it does |
| --- | --- | --- |
| Overview | `/overview` | Runway countdown, registration stats, task progress by team |
| Tasks | `/tasks` | Every task grouped by Content / Design / Analyst / Developer |
| Team | `/team` | Who has access, what team they're on, what they're carrying |
| Event | `/events/wwc` | All WWC details — dates, venue, capacity, tickets |
| Sign in | `/login` | Email + password. No public signup. |

## Who can do what

| | Admin | Member |
| --- | --- | --- |
| See all tasks | ✅ | ✅ |
| Add a task | ✅ | ✅ |
| Edit / complete a task | any task | ones assigned to or created by them |
| Delete a task | ✅ | ❌ |
| Assign work to others | ✅ | ❌ |
| Edit the event | ✅ | ❌ |
| Change someone's team or role | ✅ | ❌ |

These rules are enforced in Postgres by Row Level Security, not just in the UI.
A member cannot delete a task by calling the API directly.

---

## Setup

### 1. Create the Supabase project

[supabase.com/dashboard](https://supabase.com/dashboard) → **New project**. Save
the database password somewhere safe.

### 2. Run the migrations

Supabase Dashboard → **SQL Editor** → **New query**. Run these in order, one at
a time:

1. `supabase/migrations/0001_init.sql` — profiles, events, registrations, RLS
2. `supabase/migrations/0002_seed_wwc.sql` — creates the WWC event row
3. `supabase/migrations/0003_tasks.sql` — departments, tasks, task RLS

### 3. Turn off public signup

**Authentication** → **Sign In / Providers** → **Email** → turn off
**Allow new users to sign up**.

This is what makes the dashboard invite-only. Without it, anyone who finds the
URL can create an account.

### 4. Create your account, then make yourself admin

**Authentication** → **Users** → **Add user** → **Create new user**. Tick
**Auto Confirm User** or you'll be waiting on a confirmation email.

Then edit `supabase/migrations/0004_make_admin.sql` to use your email and run it
in the SQL Editor. You only need to do this once — after that you can promote
people from the Team page.

### 5. Add your keys

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Both are in **Project Settings → API Keys** (or click **Connect** at the top of
the dashboard, which shows them pre-formatted). Never put the `service_role`
secret key here — anything named `NEXT_PUBLIC_*` is shipped to the browser.

### 6. Run it

```bash
npm install
npm run dev
```

http://localhost:3000

Until step 5 is done, every page shows a setup checklist instead of crashing.

---

## Adding a teammate

1. Supabase → **Authentication** → **Users** → **Add user**, tick **Auto Confirm
   User**
2. Send them the email and password you set
3. Refresh `/team` and use **Edit** to put them on a team and set their role

The four teams are Content, Design, Analyst and Developer. Admins can be left
with no team since they work across all of them.

---

## Notes for whoever picks this up next

**Dates.** `events.starts_at` / `ends_at` are stored in UTC. The event form
shows and accepts wall-clock time at the venue, converting through
`events.timezone`. The helpers are `utcToZonedInput` / `zonedInputToUtc` in
`src/lib/format.ts`.

**Task completion.** `status` and `completed_at` are kept in sync by the
`tasks_sync_completion` trigger, and a check constraint enforces that a done
task has a timestamp. Don't set `completed_at` from application code.

**Database types.** `src/lib/supabase/types.ts` is hand-maintained and must
match the SQL. Every row shape is a `type`, not an `interface` — postgrest-js
constrains tables to `Record<string, unknown>`, and only type aliases get the
implicit index signature that satisfies it. Using an interface silently degrades
every query result to `never`. To regenerate instead:

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
```

**Auth.** `src/proxy.ts` (Next 16's renamed middleware) refreshes the session on
every navigation and redirects signed-out visitors to `/login`. The `(app)`
layout checks again with `requireSession()`, so no page can leak by being
reached another way.

**Registrations.** The table, RLS and rollups exist and the Overview reads from
them, but there's no UI to add or manage registrations yet. That's the obvious
next module.
