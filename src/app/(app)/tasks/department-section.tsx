import { AddTask } from "@/app/(app)/tasks/add-task";
import { TaskItem } from "@/app/(app)/tasks/task-item";
import type { DepartmentMeta } from "@/lib/domain";
import type { TaskWithPeople, TeamMember } from "@/lib/tasks";

interface DepartmentSectionProps {
  meta: DepartmentMeta;
  tasks: TaskWithPeople[];
  team: TeamMember[];
  loadByPerson: Record<string, number>;
  eventId: string;
  userId: string;
  isAdmin: boolean;
}

export function DepartmentSection({
  meta,
  tasks,
  team,
  loadByPerson,
  eventId,
  userId,
  isAdmin,
}: DepartmentSectionProps) {
  const done = tasks.filter((task) => task.status === "done").length;
  const percent = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className={`h-2 w-2 rounded-full ${meta.dot}`} />
          <h2 className="font-display text-[1.125rem] font-medium text-ink">
            {meta.label}
          </h2>
          <span className="tnum font-mono text-[0.6875rem] tracking-[0.1em] text-ink-3">
            {done}/{tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {tasks.length > 0 ? (
            <div
              className="hidden h-1 w-24 overflow-hidden rounded-full bg-line sm:block"
              role="img"
              aria-label={`${percent}% of ${meta.label} tasks delivered`}
            >
              <div
                className={`h-full ${meta.dot}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          ) : null}
          <AddTask
            eventId={eventId}
            team={team}
            loadByPerson={loadByPerson}
            defaultDepartment={meta.value}
            label="Add task"
          />
        </div>
      </header>

      {tasks.length === 0 ? (
        <p className="px-5 py-6 text-[0.875rem] leading-relaxed text-ink-3">
          Nothing here yet. {meta.remit}
        </p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              team={team}
              loadByPerson={loadByPerson}
              canEdit={
                isAdmin ||
                task.assignee_id === userId ||
                task.created_by === userId
              }
              // Creators can withdraw what they raised; admins remove anything.
              canDelete={isAdmin || task.created_by === userId}
              canReview={isAdmin || task.reviewer_id === userId}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
