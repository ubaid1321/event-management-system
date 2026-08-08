const MS_PER_DAY = 86_400_000;

function safeTimeZone(timeZone: string | null | undefined) {
  if (!timeZone) return "UTC";
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

export function formatDate(
  value: string | null | undefined,
  timeZone?: string | null,
) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: safeTimeZone(timeZone),
  }).format(date);
}

export function formatDateTime(
  value: string | null | undefined,
  timeZone?: string | null,
) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: safeTimeZone(timeZone),
  }).format(date);
}

/** "12–14 Mar 2026" / "12 Mar 2026" / null when undated. */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  timeZone?: string | null,
) {
  const startLabel = formatDate(start, timeZone);
  if (!startLabel) return null;
  const endLabel = formatDate(end, timeZone);
  if (!endLabel || endLabel === startLabel) return startLabel;

  const [startDay, startMonth, startYear] = startLabel.split(" ");
  const [endDay, endMonth, endYear] = endLabel.split(" ");
  if (startYear === endYear) {
    return startMonth === endMonth
      ? `${startDay}–${endDay} ${endMonth} ${endYear}`
      : `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
  }
  return `${startLabel} – ${endLabel}`;
}

/** Everything VMI Collective sells is priced in Indian rupees. */
export const CURRENCY = "INR";

export function formatMoney(paise: number, currency: string = CURRENCY) {
  try {
    // en-IN so large amounts group the Indian way: ₹1,25,000 not ₹125,000.
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
    }).format(paise / 100);
  } catch {
    return `${(paise / 100).toFixed(2)} ${currency}`;
  }
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

/**
 * Whole days from now until `value`, counted from midnight UTC on each side so
 * the number does not tick over mid-afternoon. Negative once the date passes.
 */
export function daysUntil(value: string | null | undefined) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const targetDay = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate(),
  );
  const nowDay = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.round((targetDay - nowDay) / MS_PER_DAY);
}

// ---------------------------------------------------------------------------
// datetime-local <-> UTC, in the event's own timezone
//
// The form shows wall-clock time at the venue ("doors at 09:00 in Mumbai"),
// while the database stores UTC. These two convert between them so the number
// a coordinator types is the number attendees will see.
// ---------------------------------------------------------------------------

/** Milliseconds `timeZone` is ahead of UTC at the given instant. */
function offsetAt(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24, // some engines render midnight as "24"
    get("minute"),
    get("second"),
  );
  return asIfUtc - utcMs;
}

/** ISO timestamp -> "YYYY-MM-DDTHH:mm" for a datetime-local input. */
export function utcToZonedInput(
  value: string | null | undefined,
  timeZone?: string | null,
) {
  if (!value) return "";
  const utcMs = new Date(value).getTime();
  if (Number.isNaN(utcMs)) return "";
  const shifted = utcMs + offsetAt(utcMs, safeTimeZone(timeZone));
  return new Date(shifted).toISOString().slice(0, 16);
}

/** "YYYY-MM-DDTHH:mm" in `timeZone` -> ISO timestamp, or null if unparseable. */
export function zonedInputToUtc(
  value: string | null | undefined,
  timeZone?: string | null,
) {
  if (!value) return null;
  const zone = safeTimeZone(timeZone);
  const naive = new Date(`${value.slice(0, 16)}:00Z`).getTime();
  if (Number.isNaN(naive)) return null;

  // Two passes so instants near a DST boundary resolve to the right offset.
  let utcMs = naive - offsetAt(naive, zone);
  utcMs = naive - offsetAt(utcMs, zone);
  return new Date(utcMs).toISOString();
}

/**
 * How far along we are between two instants, as 0–100.
 *
 * Reading the clock lives here rather than in a component body so rendering
 * stays pure.
 */
export function progressBetween(
  from: string | null | undefined,
  to: string | null | undefined,
) {
  if (!from || !to) return 100;
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 100;
  const elapsed = Date.now() - start;
  return Math.min(100, Math.max(0, (elapsed / (end - start)) * 100));
}

/**
 * IANA zone names for the timezone picker.
 *
 * Node and browsers disagree here: Node's `Intl.supportedValuesOf("timeZone")`
 * omits "UTC" entirely and ships legacy aliases (Asia/Calcutta, not
 * Asia/Kolkata), while Chrome lists the canonical modern names and includes
 * UTC. Rendering a <select> whose value is missing from the options makes the
 * server and client disagree about which option is selected — a hydration
 * mismatch. So: always fold in UTC and the zone actually in use.
 */
export function listTimeZones(current?: string | null): string[] {
  const supported = Intl.supportedValuesOf?.("timeZone") ?? [];
  const fallback = [
    "Asia/Kolkata",
    "Asia/Calcutta",
    "Europe/London",
    "America/New_York",
  ];

  const zones = new Set<string>(
    supported.length > 0 ? supported : fallback,
  );
  zones.add("Asia/Kolkata");
  if (current) zones.add(current);
  zones.delete("UTC");

  // UTC first — it is the default and the one people reach for deliberately.
  return ["UTC", ...[...zones].sort((a, b) => a.localeCompare(b))];
}
