"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { updateEvent } from "@/app/(app)/events/[slug]/actions";
import { emptyFormState } from "@/lib/form-state";
import { utcToZonedInput } from "@/lib/format";
import type { EventRow } from "@/lib/supabase/types";

const STATUS_OPTIONS = [
  { value: "planning", label: "Planning — not announced yet" },
  { value: "open", label: "Registration open" },
  { value: "live", label: "Happening now" },
  { value: "closed", label: "Registration closed" },
  { value: "archived", label: "Archived — finished" },
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving…" : "Save event"}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[0.75rem] text-ink-3">{hint}</p> : null}
    </div>
  );
}

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-line pt-5">
      {/* The legend sits in normal flow. An earlier version floated it up with
          a negative margin, which put an opaque box over the inputs above and
          silently ate their clicks. */}
      <legend className="label mb-4">{legend}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function EventForm({
  event,
  timeZones,
  canEdit,
}: {
  event: EventRow;
  timeZones: string[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(updateEvent, emptyFormState);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="id" value={event.id} />

      {!canEdit ? (
        <p className="rounded-[var(--radius-control)] border border-line-strong bg-surface-2 px-4 py-3 text-[0.875rem] leading-relaxed text-ink-2">
          These fields are read-only because your account is a member, not an
          admin. Ask an admin to change the event, or to promote you on the Team
          page.
        </p>
      ) : null}

      <fieldset disabled={!canEdit} className="contents">
        <Fieldset legend="Identity">
          <Field label="Name" htmlFor="name" className="sm:col-span-2">
            <input
              id="name"
              name="name"
              required
              defaultValue={event.name}
              className="input"
            />
          </Field>

          <Field
            label="Tagline"
            htmlFor="tagline"
            className="sm:col-span-2"
            hint="One line. Appears on the overview."
          >
            <input
              id="tagline"
              name="tagline"
              defaultValue={event.tagline ?? ""}
              placeholder="A global gathering for wisdom traditions in practice."
              className="input"
            />
          </Field>

          <Field label="Description" htmlFor="description" className="sm:col-span-2">
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={event.description ?? ""}
              className="textarea"
            />
          </Field>

          <Field label="Status" htmlFor="status">
            <select
              id="status"
              name="status"
              defaultValue={event.status}
              className="input"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Website" htmlFor="website_url">
            <input
              id="website_url"
              name="website_url"
              type="url"
              defaultValue={event.website_url ?? ""}
              placeholder="https://worldwisdomconnect.org"
              className="input"
            />
          </Field>
        </Fieldset>

        <Fieldset legend="When">
          <Field
            label="Timezone"
            htmlFor="timezone"
            className="sm:col-span-2"
            hint="The times below are wall-clock times at the venue."
          >
            <select
              id="timezone"
              name="timezone"
              defaultValue={event.timezone}
              className="input"
            >
              {timeZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Starts" htmlFor="starts_at">
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              defaultValue={utcToZonedInput(event.starts_at, event.timezone)}
              className="input"
            />
          </Field>

          <Field label="Ends" htmlFor="ends_at">
            <input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              defaultValue={utcToZonedInput(event.ends_at, event.timezone)}
              className="input"
            />
          </Field>
        </Fieldset>

        <Fieldset legend="Where">
          <Field label="Venue" htmlFor="venue_name">
            <input
              id="venue_name"
              name="venue_name"
              defaultValue={event.venue_name ?? ""}
              className="input"
            />
          </Field>

          <Field label="Address" htmlFor="venue_address">
            <input
              id="venue_address"
              name="venue_address"
              defaultValue={event.venue_address ?? ""}
              className="input"
            />
          </Field>

          <Field label="City" htmlFor="city">
            <input
              id="city"
              name="city"
              defaultValue={event.city ?? ""}
              className="input"
            />
          </Field>

          <Field label="Country" htmlFor="country">
            <input
              id="country"
              name="country"
              defaultValue={event.country ?? ""}
              className="input"
            />
          </Field>
        </Fieldset>

        <Fieldset legend="Tickets">
          <Field
            label="Capacity"
            htmlFor="capacity"
            hint="Total seats. Leave blank if uncapped."
          >
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={0}
              step={1}
              defaultValue={event.capacity ?? ""}
              className="input"
            />
          </Field>

          <Field
            label="Ticket price"
            htmlFor="ticket_price"
            hint="In rupees. 0 for a free event."
          >
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-[1.0625rem] text-ink-3">
                ₹
              </span>
              <input
                id="ticket_price"
                name="ticket_price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={(event.ticket_price_cents / 100).toFixed(2)}
                className="input"
              />
            </div>
          </Field>

          <Field label="Contact email" htmlFor="contact_email">
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={event.contact_email ?? ""}
              className="input"
            />
          </Field>
        </Fieldset>
      </fieldset>

      {state.error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-control)] border border-clay/40 bg-clay-soft px-3 py-2.5 text-[0.8125rem] text-clay"
        >
          {state.error}
        </p>
      ) : null}

      {state.ok ? (
        <p
          role="status"
          className="rounded-[var(--radius-control)] border border-jade/40 bg-jade-soft px-3 py-2.5 text-[0.8125rem] text-jade"
        >
          Event saved.
        </p>
      ) : null}

      {canEdit ? (
        <div>
          <Submit />
        </div>
      ) : null}
    </form>
  );
}
