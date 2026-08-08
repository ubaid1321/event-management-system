import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventForm } from "@/app/(app)/events/[slug]/event-form";
import { CountdownRule } from "@/components/countdown-rule";
import { Card, FactRow, PageHeader, StatusPill } from "@/components/ui";
import { getEventBySlug, getEventStats } from "@/lib/events";
import {
  formatDateRange,
  formatMoney,
  formatNumber,
  listTimeZones,
} from "@/lib/format";
import { requireSession } from "@/lib/session";
import { getTasks, summariseTasks } from "@/lib/tasks";

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return { title: event?.name ?? "Event" };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const session = await requireSession();
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const [stats, tasks] = await Promise.all([
    getEventStats(event.id, event.capacity),
    getTasks(event.id),
  ]);
  const taskStats = summariseTasks(tasks);

  const location =
    [event.venue_name, event.city, event.country].filter(Boolean).join(", ") ||
    null;

  return (
    <>
      <PageHeader
        eyebrow="Event"
        title={event.name}
        description={event.tagline}
        actions={<StatusPill status={event.status} />}
      />

      <CountdownRule
        slug={event.slug}
        startsAt={event.starts_at}
        endsAt={event.ends_at}
        timezone={event.timezone}
        createdAt={event.created_at}
      />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card className="h-fit p-6">
          <h2 className="label">At a glance</h2>
          <dl className="mt-4">
            <FactRow label="Dates">
              {formatDateRange(event.starts_at, event.ends_at, event.timezone) ??
                "Not set"}
            </FactRow>
            <FactRow label="Timezone">{event.timezone}</FactRow>
            <FactRow label="Where">{location ?? "Not set"}</FactRow>
            <FactRow label="Capacity">
              {event.capacity ? formatNumber(event.capacity) : "Uncapped"}
            </FactRow>
            <FactRow label="Registered">
              <span className="tnum">{formatNumber(stats.total)}</span>
            </FactRow>
            <FactRow label="Ticket">
              {event.ticket_price_cents > 0
                ? formatMoney(event.ticket_price_cents, event.currency)
                : "Free"}
            </FactRow>
            <FactRow label="Tasks">
              <span className="tnum">
                {taskStats.total === 0
                  ? "None yet"
                  : `${taskStats.done}/${taskStats.total} delivered`}
              </span>
            </FactRow>
            <FactRow label="Reference">
              <span className="font-mono text-[0.8125rem] text-ink-2">
                {event.slug}
              </span>
            </FactRow>
          </dl>
        </Card>

        <Card className="p-6 sm:p-7">
          <h2 className="label mb-7">Event details</h2>
          <EventForm
            event={event}
            timeZones={listTimeZones(event.timezone)}
            canEdit={session.isAdmin}
          />
        </Card>
      </div>
    </>
  );
}
