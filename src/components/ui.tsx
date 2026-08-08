import type { ReactNode } from "react";

import type { EventStatus } from "@/lib/supabase/types";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-line bg-surface ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <p className="label mb-3">{eyebrow}</p> : null}
        <h1 className="font-display text-[2rem] leading-[1.15] font-medium tracking-tight text-ink sm:text-[2.375rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink-2">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
  );
}

const STATUS_COPY: Record<EventStatus, { label: string; className: string }> = {
  planning: {
    label: "Planning",
    className: "bg-surface-2 text-ink-2 border-line-strong",
  },
  open: {
    label: "Registration open",
    className: "bg-jade-soft text-jade border-jade/30",
  },
  live: {
    label: "Happening now",
    className: "bg-brass-soft text-brass border-brass/35",
  },
  closed: {
    label: "Registration closed",
    className: "bg-clay-soft text-clay border-clay/30",
  },
  archived: {
    label: "Archived",
    className: "bg-surface-2 text-ink-3 border-line",
  },
};

export function StatusPill({ status }: { status: EventStatus }) {
  const { label, className } = STATUS_COPY[status] ?? STATUS_COPY.planning;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[0.625rem] tracking-[0.12em] uppercase ${className}`}
    >
      {label}
    </span>
  );
}

export function StatTile({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail?: string | null;
  accent?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <p className="label">{label}</p>
      <p
        className={`tnum font-display mt-4 text-[2.25rem] leading-none font-medium ${
          accent ? "text-brass" : "text-ink"
        }`}
      >
        {value}
      </p>
      {detail ? (
        <p className="mt-2.5 text-[0.8125rem] leading-snug text-ink-3">
          {detail}
        </p>
      ) : null}
      {accent ? (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px origin-left bg-brass sweep"
        />
      ) : null}
    </div>
  );
}

/** A definition row: mono label on the left, value on the right. */
export function FactRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-3.5 last:border-b-0">
      <dt className="label">{label}</dt>
      <dd className="text-right text-[0.9375rem] text-ink">{children}</dd>
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.9375rem] leading-relaxed text-ink-3">{children}</p>
  );
}
