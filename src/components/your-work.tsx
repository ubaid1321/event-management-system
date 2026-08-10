import Link from "next/link";

import { departmentMeta, TASK_STATUS_BY_VALUE } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import type { MyWork, TaskWithPeople } from "@/lib/tasks";

function personName(person: { full_name: string | null; email: string | null } | null) {
  return person?.full_name?.trim() || person?.email || null;
}

function TaskLine({
  task,
  trailing,
}: {
  task: TaskWithPeople;
  trailing?: string | null;
}) {
  const meta = departmentMeta(task.department);
  const status = TASK_STATUS_BY_VALUE.get(task.status);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = task.status !== "done" && !!task.due_on && task.due_on < today;

  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line py-3 last:border-b-0">
      <span
        aria-hidden
        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${meta?.dot ?? "bg-ink-3"}`}
      />
      <span className="min-w-0 flex-1 text-[0.9375rem] leading-snug text-ink">
        {task.title}
      </span>
      <span className="font-mono text-[0.6875rem] tracking-[0.06em] text-ink-3">
        {trailing ??
          (task.due_on ? (
            <span className={overdue ? "text-clay" : undefined}>
              {overdue ? "Overdue " : "Due "}
              {formatDate(task.due_on)}
            </span>
          ) : (
            (status?.label ?? "")
          ))}
      </span>
    </li>
  );
}

function Panel({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone: "brand" | "plain";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border bg-surface p-5 ${
        tone === "brand" && count > 0
          ? "border-brand/45"
          : "border-line"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="label">{title}</h2>
        <span
          className={`tnum font-mono text-[0.6875rem] tracking-[0.1em] ${
            tone === "brand" && count > 0 ? "text-brand" : "text-ink-3"
          }`}
        >
          {count}
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * The signed-in person's own queue, shown above everything else on the
 * Overview. Review sits first: work parked in your queue is blocking someone
 * else, so it is the more urgent of the two.
 */
export function YourWork({ work, name }: { work: MyWork; name: string }) {
  const firstName = name.split(/\s+/)[0];
  const nothing = work.assigned.length === 0 && work.toReview.length === 0;

  return (
    <section className="mb-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-[1.375rem] leading-snug font-medium text-ink">
          {nothing ? `Nothing on you, ${firstName}` : `Yours, ${firstName}`}
        </h2>
        <Link
          href="/tasks"
          className="font-mono text-[0.6875rem] tracking-[0.14em] text-brand uppercase underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
        >
          Whole board
        </Link>
      </div>

      {nothing ? (
        <p className="rounded-[var(--radius-card)] border border-line bg-surface p-5 text-[0.9375rem] leading-relaxed text-ink-3">
          No tasks are assigned to you and nothing is waiting on your review.
          Pick something up from the board when you&apos;re ready.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title="Waiting on your review"
            count={work.toReview.length}
            tone="brand"
          >
            {work.toReview.length === 0 ? (
              <p className="text-[0.875rem] leading-relaxed text-ink-3">
                Nothing to review. You&apos;re not holding anyone up.
              </p>
            ) : (
              <ul>
                {work.toReview.map((task) => (
                  <TaskLine
                    key={task.id}
                    task={task}
                    trailing={
                      personName(task.assignee)
                        ? `from ${personName(task.assignee)}`
                        : "unassigned"
                    }
                  />
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Assigned to you"
            count={work.assigned.length}
            tone="plain"
          >
            {work.assigned.length === 0 ? (
              <p className="text-[0.875rem] leading-relaxed text-ink-3">
                Nothing assigned to you right now.
              </p>
            ) : (
              <ul>
                {work.assigned.slice(0, 6).map((task) => (
                  <TaskLine key={task.id} task={task} />
                ))}
              </ul>
            )}
            {work.assigned.length > 6 ? (
              <p className="mt-3 font-mono text-[0.6875rem] tracking-[0.1em] text-ink-3 uppercase">
                +{work.assigned.length - 6} more on the board
              </p>
            ) : null}
          </Panel>
        </div>
      )}
    </section>
  );
}
