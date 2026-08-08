import Link from "next/link";

import {
  daysUntil,
  formatDate,
  formatDateRange,
  progressBetween,
} from "@/lib/format";

interface CountdownRuleProps {
  slug: string;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  /** Anchors the left end of the scale: when this event entered the system. */
  createdAt: string;
}

/**
 * The runway scale.
 *
 * A ruled navigational line running from the day the event was created to the
 * day it opens, with a marker at today. It answers the two questions this
 * dashboard exists to answer at a glance: how long is left, and how much of
 * the runway is already spent.
 */
export function CountdownRule({
  slug,
  startsAt,
  endsAt,
  timezone,
  createdAt,
}: CountdownRuleProps) {
  const range = formatDateRange(startsAt, endsAt, timezone);

  if (!startsAt || !range) {
    return (
      <Shell>
        <p className="label">Runway</p>
        <p className="mt-4 max-w-[42ch] text-[1.0625rem] leading-relaxed text-rail-ink-2">
          This event has no dates yet.{" "}
          <Link
            href={`/events/${slug}`}
            className="text-brass underline decoration-brass/40 underline-offset-4 hover:decoration-brass"
          >
            Set the dates
          </Link>{" "}
          to start the countdown.
        </p>
      </Shell>
    );
  }

  const daysToStart = daysUntil(startsAt) ?? 0;
  const daysToEnd = daysUntil(endsAt ?? startsAt) ?? daysToStart;

  const progress = progressBetween(createdAt, startsAt);

  let headline: string;
  let caption: string;

  if (daysToStart > 0) {
    headline = String(daysToStart);
    caption = daysToStart === 1 ? "day until doors open" : "days until doors open";
  } else if (daysToEnd >= 0) {
    headline = "Now";
    caption = "World Wisdom Connect is running";
  } else {
    headline = String(Math.abs(daysToEnd));
    caption = daysToEnd === -1 ? "day since it ended" : "days since it ended";
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p className="label">Runway</p>
          <p className="mt-4 flex items-baseline gap-3">
            <span className="tnum font-display text-[3.5rem] leading-[0.9] font-medium text-rail-ink sm:text-[4.25rem]">
              {headline}
            </span>
            <span className="text-[0.9375rem] text-rail-ink-2">{caption}</span>
          </p>
        </div>
        <p className="font-mono text-[0.8125rem] tracking-[0.04em] text-rail-ink-2">
          {range}
          <span className="mx-2 opacity-40">/</span>
          {timezone}
        </p>
      </div>

      {/* The scale itself */}
      <div className="mt-9">
        <div className="relative h-6">
          <div
            aria-hidden
            className="meridian-ticks absolute inset-x-0 bottom-0 h-3 text-rail-ink-2"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px bg-rail-line"
          />
          <div
            aria-hidden
            className="absolute bottom-0 left-0 h-px origin-left bg-brass sweep"
            style={{ width: `${progress}%` }}
          />
          <div
            aria-hidden
            className="absolute bottom-0 h-6 w-px bg-brass"
            style={{ left: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between font-mono text-[0.6875rem] tracking-[0.1em] text-rail-ink-2 uppercase">
          <span>Planning began {formatDate(createdAt, timezone)}</span>
          <span className="text-brass">{formatDate(startsAt, timezone)}</span>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="on-dark relative overflow-hidden rounded-[var(--radius-card)] bg-rail p-6 sm:p-8">
      <div aria-hidden className="meridian-field absolute inset-0" />
      <div className="relative">{children}</div>
    </section>
  );
}
