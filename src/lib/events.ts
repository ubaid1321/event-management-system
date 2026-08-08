import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EventRow, RegistrationStatus } from "@/lib/supabase/types";

export interface EventStats {
  total: number;
  confirmed: number;
  pending: number;
  waitlisted: number;
  cancelled: number;
  checkedIn: number;
  /** Registrations that hold a seat: confirmed + pending. */
  seatsTaken: number;
  seatsLeft: number | null;
  fillPercent: number | null;
  revenueCents: number;
  lastRegisteredAt: string | null;
}

const EMPTY_STATS: EventStats = {
  total: 0,
  confirmed: 0,
  pending: 0,
  waitlisted: 0,
  cancelled: 0,
  checkedIn: 0,
  seatsTaken: 0,
  seatsLeft: null,
  fillPercent: null,
  revenueCents: 0,
  lastRegisteredAt: null,
};

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as EventRow | null) ?? null;
}

export async function getPrimaryEvent(): Promise<EventRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return (data as EventRow | null) ?? null;
}

/**
 * Rolls up one event's registrations.
 *
 * Reads the rows rather than issuing five count queries: at a few thousand
 * registrations this is one round trip instead of six, and it is the same data
 * the registrations table will need next.
 */
export async function getEventStats(
  eventId: string,
  capacity: number | null,
): Promise<EventStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("status, amount_paid_cents, checked_in_at, registered_at")
    .eq("event_id", eventId);

  if (error || !data) {
    return { ...EMPTY_STATS, seatsLeft: capacity };
  }

  const stats = { ...EMPTY_STATS };

  for (const row of data) {
    const status = row.status as RegistrationStatus;
    stats.total += 1;
    if (status === "confirmed") stats.confirmed += 1;
    if (status === "pending") stats.pending += 1;
    if (status === "waitlisted") stats.waitlisted += 1;
    if (status === "cancelled") stats.cancelled += 1;
    if (row.checked_in_at) stats.checkedIn += 1;
    if (status !== "cancelled") stats.revenueCents += row.amount_paid_cents;
    if (
      !stats.lastRegisteredAt ||
      row.registered_at > stats.lastRegisteredAt
    ) {
      stats.lastRegisteredAt = row.registered_at;
    }
  }

  stats.seatsTaken = stats.confirmed + stats.pending;

  if (capacity && capacity > 0) {
    stats.seatsLeft = Math.max(0, capacity - stats.seatsTaken);
    stats.fillPercent = Math.round((stats.seatsTaken / capacity) * 100);
  }

  return stats;
}
