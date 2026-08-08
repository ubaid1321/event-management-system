import type { Metadata } from "next";
import Link from "next/link";

import { CountdownRule } from "@/components/countdown-rule";
import { Card, EmptyNote, PageHeader, StatTile, StatusPill } from "@/components/ui";
import { DEPARTMENTS } from "@/lib/domain";
import { getEventStats, getPrimaryEvent } from "@/lib/events";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { getTasks, summariseTasks } from "@/lib/tasks";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function OverviewPage() {
  const event = await getPrimaryEvent();

  if (!event) {
    return (
      <>
        <PageHeader eyebrow="VMI Collective" title="Overview" />
        <Card className="p-8">
          <EmptyNote>
            No events found. Run{" "}
            <code className="font-mono text-[0.875rem] text-ink-2">
              supabase/migrations/0002_seed_wwc.sql
            </code>{" "}
            in the Supabase SQL Editor to add World Wisdom Connect.
          </EmptyNote>
        </Card>
      </>
    );
  }

  const [stats, tasks] = await Promise.all([
    getEventStats(event.id, event.capacity),
    getTasks(event.id),
  ]);
  const taskStats = summariseTasks(tasks);
  const hasRegistrations = stats.total > 0;

  return (
    <>
      <PageHeader
        eyebrow="VMI Collective"
        title="Overview"
        description={`Where ${event.name} stands today.`}
        actions={<StatusPill status={event.status} />}
      />

      <CountdownRule
        slug={event.slug}
        startsAt={event.starts_at}
        endsAt={event.ends_at}
        timezone={event.timezone}
        createdAt={event.created_at}
      />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Registered"
          value={formatNumber(stats.total)}
          detail={
            hasRegistrations
              ? `${formatNumber(stats.confirmed)} confirmed · ${formatNumber(stats.pending)} pending`
              : "No one has registered yet."
          }
          accent
        />
        <StatTile
          label="Seats left"
          value={
            event.capacity && event.capacity > 0
              ? formatNumber(stats.seatsLeft ?? 0)
              : "—"
          }
          detail={
            event.capacity && event.capacity > 0
              ? `${stats.fillPercent}% of ${formatNumber(event.capacity)} taken`
              : "Set a capacity on the event page."
          }
        />
        <StatTile
          label="Waitlist"
          value={formatNumber(stats.waitlisted)}
          detail={
            stats.waitlisted > 0
              ? "Move people up as seats free."
              : "Nobody is waiting."
          }
        />
        <StatTile
          label="Collected"
          value={formatMoney(stats.revenueCents, event.currency)}
          detail={
            event.ticket_price_cents > 0
              ? `Ticket ${formatMoney(event.ticket_price_cents, event.currency)}`
              : "Free event."
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="label">Work by team</h2>
            <Link
              href="/tasks"
              className="font-mono text-[0.6875rem] tracking-[0.14em] text-brass uppercase underline decoration-brass/40 underline-offset-4 hover:decoration-brass"
            >
              Open board
            </Link>
          </div>

          {taskStats.total === 0 ? (
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-3">
              No tasks yet.{" "}
              <Link href="/tasks" className="text-brass underline decoration-brass/40 underline-offset-4">
                Add the first one
              </Link>{" "}
              and it will show up here.
            </p>
          ) : (
            <ul className="mt-5 flex flex-col gap-4">
              {DEPARTMENTS.map((meta) => {
                const bucket = taskStats.byDepartment[meta.value];
                const percent =
                  bucket.total > 0
                    ? Math.round((bucket.done / bucket.total) * 100)
                    : 0;
                return (
                  <li key={meta.value}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[0.875rem] text-ink">
                        {meta.label}
                      </span>
                      <span className="tnum font-mono text-[0.6875rem] tracking-[0.08em] text-ink-3">
                        {bucket.total === 0
                          ? "No tasks"
                          : `${bucket.done}/${bucket.total}`}
                      </span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                      <div
                        className={`h-full ${meta.dot}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-6 border-t border-line pt-4 text-[0.8125rem] leading-relaxed text-ink-3">
            {taskStats.blocked > 0 || taskStats.overdue > 0
              ? `${taskStats.blocked} blocked · ${taskStats.overdue} overdue.`
              : taskStats.total > 0
                ? "Nothing blocked or overdue."
                : "Tasks are grouped by Content, Design, Analyst and Developer."}
          </p>
        </Card>

        <div className="flex flex-col gap-4">
        <Card className="p-6">
          <h2 className="label">Latest activity</h2>
          <div className="mt-5">
            {stats.lastRegisteredAt ? (
              <p className="text-[0.9375rem] leading-relaxed text-ink-2">
                Most recent registration came in{" "}
                <span className="tnum text-ink">
                  {formatDateTime(stats.lastRegisteredAt, event.timezone)}
                </span>
                . {formatNumber(stats.checkedIn)} of {formatNumber(stats.total)}{" "}
                have checked in.
              </p>
            ) : (
              <EmptyNote>
                Registrations will appear here as they come in. Nothing has been
                recorded for {event.name} yet.
              </EmptyNote>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="label">The event</h2>
          <p className="font-display mt-5 text-[1.375rem] leading-snug font-medium text-ink">
            {event.name}
          </p>
          {event.tagline ? (
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
              {event.tagline}
            </p>
          ) : null}
          <Link
            href={`/events/${event.slug}`}
            className="mt-5 inline-block font-mono text-[0.6875rem] tracking-[0.14em] text-brass uppercase underline decoration-brass/40 underline-offset-4 hover:decoration-brass"
          >
            Open event details
          </Link>
        </Card>
        </div>
      </div>
    </>
  );
}
