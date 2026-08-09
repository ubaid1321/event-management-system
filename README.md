# VMI Collective Event Management

Internal dashboard for running VMI Collective events. Currently tracking one:
**World Wisdom Connect (WWC)**.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth).

---

## What's in it

| Page | Path | What it does |
| --- | --- | --- |
| Overview | `/overview` | Runway countdown, registration stats, task progress by team |
| Tasks | `/tasks` | Every task grouped by Content / Design / Analyst / Developer / Marketing |
| Team | `/team` | Who has access, what team they're on, what they're carrying |
| Event | `/events/wwc` | All WWC details: dates, venue, capacity, tickets |
| Sign in | `/login` | Email + password. No public signup. |

## Who can do what

| | Admin | Member |
| --- | --- | --- |
| See all tasks | ✅ | ✅ |
| Add a task | ✅ | ✅ |
| Edit a task | any task | ones assigned to, created by, or being reviewed by them |
| Delete a task | any task | ones they created |
| Approve / send back a review | any task | ones where they are the reviewer |
| Assign work to others | ✅ | ❌ |
| Edit the event | ✅ | ❌ |
| Change someone's team or role | ✅ | ❌ |

## How a task moves

```
todo ──▶ in progress ──▶ in review ──▶ done
              ▲               │
              └── changes ────┘
```

Finished work does not go straight to done. The owner picks a reviewer and
sends it over; the reviewer either approves it or sends it back with a note
saying what needs changing. The reviewer dropdown shows each person's open task
count, so work goes to whoever has room for it.

`in_review` is deliberately unreachable from the status dropdown. It needs a
named reviewer, so it goes through **Send for review** instead. A database
constraint enforces the same rule, so a task can never sit in review with
nobody assigned to look at it.

The five teams are **Content**, **Design**, **Analyst**, **Developer** and
**Marketing**.

## What you see when you sign in

The Overview opens with your own queue, before anything organisation-wide:

- **Waiting on your review**: shown first, because it's blocking someone else
- **Assigned to you**: everything unfinished, soonest due first

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

1. `0001_init.sql` creates profiles, events, registrations and their RLS
2. `0002_seed_wwc.sql` creates the WWC event row
3. `0003_tasks.sql` adds departments, tasks and task RLS
4. `0005_currency_inr.sql` prices everything in rupees
5. `0006_backfill_profiles.sql` gives every account a profile row
6. `0007_review_and_marketing.sql` adds the review step and the Marketing team

(`0004_make_admin.sql` is step 4 below, once your account exists.)

### 3. Turn off public signup

**Authentication** → **Sign In / Providers** → **Email** → turn off
**Allow new users to sign up**.

This is what makes the dashboard invite-only. Without it, anyone who finds the
URL can create an account.

### 4. Create your account, then make yourself admin

**Authentication** → **Users** → **Add user** → **Create new user**. Tick
**Auto Confirm User** or you'll be waiting on a confirmation email.

Then edit `supabase/migrations/0004_make_admin.sql` to use your email and run it
in the SQL Editor. You only need to do this once. After that you can promote
people from the Team page.

### 5. Add your keys

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Both are in **Project Settings → API Keys** (or click **Connect** at the top of
the dashboard, which shows them pre-formatted). Never put the `service_role`
secret key here. Anything named `NEXT_PUBLIC_*` is shipped to the browser.

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

The five teams are Content, Design, Analyst, Developer and Marketing. Admins
can be left with no team since they work across all of them.

---

## Deploying to Netlify

Config lives in `netlify.toml`. Nothing else in the repo needs changing.

### 1. Connect the repo

Netlify → **Add new site** → **Import an existing project** → GitHub →
`event-management-system`. Netlify reads `netlify.toml`, so leave the build
command and publish directory as it detects them.

### 2. Set the environment variables

**Site configuration → Environment variables.** Add both:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` with no trailing slash, no `/rest/v1` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the publishable / anon key |

Never add the `service_role` key. Nothing here uses it, and `NEXT_PUBLIC_*`
values are served to the browser.

Without these the deploy still succeeds; every page renders the setup
checklist instead of erroring.

### 3. Point Supabase at the deployed URL

**Authentication → URL Configuration:**

- **Site URL** → `https://your-site.netlify.app`
- **Redirect URLs** → add `https://your-site.netlify.app/**`, and
  `https://deploy-preview-*--your-site.netlify.app/**` if you want previews to
  work

This matters for password reset and confirmation emails, which otherwise send
people to `localhost:3000`.

### 4. Check that Proxy ran

Next 16 renamed Middleware to Proxy (`src/proxy.ts`), and the Next docs list
adapter support for it as "platform-specific". Verify after the first deploy:

1. Open the site signed out. You should land on `/login`
2. Sign in, then leave the tab for over an hour and reload

Step 1 works either way: `src/app/(app)/layout.tsx` calls `requireSession()`,
so protected pages redirect on their own even if Proxy never runs. Access
control does not depend on it.

Step 2 is the one that needs Proxy. It refreshes the Supabase access token on
each navigation; without it the token expires after about an hour and you get
signed out instead of silently renewed. If that happens, check the Netlify Next
Runtime version; older releases only look for `middleware.ts`.

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
match the SQL. Every row shape is a `type`, not an `interface`, because postgrest-js
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
