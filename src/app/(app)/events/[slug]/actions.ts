"use server";

import { revalidatePath } from "next/cache";

import type { FormState } from "@/lib/form-state";
import { CURRENCY, zonedInputToUtc } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { EventStatus } from "@/lib/supabase/types";

const STATUSES: EventStatus[] = [
  "planning",
  "open",
  "live",
  "closed",
  "archived",
];

function isEventStatus(value: unknown): value is EventStatus {
  return typeof value === "string" && STATUSES.includes(value as EventStatus);
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function url(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return { value: null as string | null, error: null as string | null };
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return { value: new URL(candidate).toString(), error: null };
  } catch {
    return { value: null, error: "That website address isn't valid." };
  }
}

export async function updateEvent(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!session.isAdmin) {
    return { error: "Only an admin can change the event.", ok: false };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Missing event. Reload the page and try again.", ok: false };
  }

  const name = text(formData, "name");
  if (!name) {
    return { error: "The event needs a name.", ok: false };
  }

  const status = formData.get("status") ?? "planning";
  if (!isEventStatus(status)) {
    return { error: "Pick a valid status.", ok: false };
  }

  const timezone = text(formData, "timezone") ?? "UTC";
  const startsAt = zonedInputToUtc(text(formData, "starts_at"), timezone);
  const endsAt = zonedInputToUtc(text(formData, "ends_at"), timezone);

  if (startsAt && endsAt && endsAt < startsAt) {
    return { error: "The event can't end before it starts.", ok: false };
  }

  const website = url(formData, "website_url");
  if (website.error) {
    return { error: website.error, ok: false };
  }

  const capacityRaw = text(formData, "capacity");
  const capacity = capacityRaw === null ? null : Number(capacityRaw);
  if (capacity !== null && (!Number.isFinite(capacity) || capacity < 0)) {
    return { error: "Capacity must be a whole number, or left blank.", ok: false };
  }

  // Price is entered in major units (12.50) and stored in minor units (1250).
  const priceRaw = text(formData, "ticket_price");
  const price = priceRaw === null ? 0 : Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Ticket price must be a number, or left blank.", ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      name,
      tagline: text(formData, "tagline"),
      description: text(formData, "description"),
      status,
      starts_at: startsAt,
      ends_at: endsAt,
      timezone,
      venue_name: text(formData, "venue_name"),
      venue_address: text(formData, "venue_address"),
      city: text(formData, "city"),
      country: text(formData, "country"),
      capacity: capacity === null ? null : Math.round(capacity),
      ticket_price_cents: Math.round(price * 100),
      currency: CURRENCY,
      website_url: website.value,
      contact_email: text(formData, "contact_email"),
    })
    .eq("id", id);

  if (error) {
    return { error: `Couldn't save the event: ${error.message}`, ok: false };
  }

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}
