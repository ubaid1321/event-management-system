"use client";

import { useActionState, useState } from "react";

import {
  deleteTask,
  setTaskStatus,
  updateTask,
} from "@/app/(app)/tasks/actions";
import { TaskFields } from "@/app/(app)/tasks/task-form";
import { emptyFormState } from "@/lib/form-state";
import { TASK_PRIORITIES, TASK_STATUS_BY_VALUE } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import type { TaskWithPeople, TeamMember } from "@/lib/tasks";

interface TaskItemProps {
  task: TaskWithPeople;
  team: TeamMember[];
  canEdit: boolean;
  canDelete: boolean;
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Open link";
  }
}

export function TaskItem({ task, team, canEdit, canDelete }: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(updateTask, emptyFormState);

  // Close the editor the moment a save lands. Adjusting state during render is
  // React's documented way to respond to a changed value without the extra
  // render pass an effect would cost.
  const [sawSave, setSawSave] = useState(state.ok);
  if (state.ok !== sawSave) {
    setSawSave(state.ok);
    if (state.ok) setEditing(false);
  }

  const status = TASK_STATUS_BY_VALUE.get(task.status);
  const priority = TASK_PRIORITIES.find((item) => item.value === task.priority);
  const assigneeName =
    task.assignee?.full_name?.trim() || task.assignee?.email || null;

  const today = new Date().toISOString().slice(0, 10);
  const overdue = task.status !== "done" && !!task.due_on && task.due_on < today;

  if (editing) {
    return (
      <li className="border-b border-line p-5 last:border-b-0">
        <form action={formAction}>
          <input type="hidden" name="id" value={task.id} />
          <TaskFields
            idPrefix={`edit-${task.id}`}
            task={task}
            team={team}
            submitLabel="Save task"
            error={state.error}
            onCancel={() => setEditing(false)}
          />
        </form>
      </li>
    );
  }

  return (
    <li className="group border-b border-line last:border-b-0">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
        {/* Status — changeable in place, because that is the most common edit */}
        <form action={setTaskStatus} className="shrink-0">
          <input type="hidden" name="id" value={task.id} />
          <select
            name="status"
            defaultValue={task.status}
            disabled={!canEdit}
            aria-label={`Status of ${task.title}`}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className={`h-7 cursor-pointer appearance-none rounded-full border px-2.5 font-mono text-[0.625rem] tracking-[0.1em] uppercase disabled:cursor-default ${status?.className ?? ""}`}
          >
            {[...TASK_STATUS_BY_VALUE.values()].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </form>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[0.9375rem] leading-snug ${
              task.status === "done" ? "text-ink-3" : "text-ink"
            }`}
          >
            {task.title}
          </p>

          {task.description ? (
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-3">
              {task.description}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[0.6875rem] tracking-[0.06em] text-ink-3">
            <span>{assigneeName ?? "Unassigned"}</span>

            {task.due_on ? (
              <span className={overdue ? "text-clay" : undefined}>
                {overdue ? "Overdue " : "Due "}
                {formatDate(task.due_on)}
              </span>
            ) : null}

            {task.priority !== "normal" ? (
              <span className={priority?.className}>
                {priority?.label} priority
              </span>
            ) : null}

            {task.completed_at ? (
              <span className="text-jade">
                Delivered {formatDate(task.completed_at)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {task.deliverable_url ? (
            <a
              href={task.deliverable_url}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-secondary max-w-[11rem] truncate"
            >
              {task.deliverable_label?.trim() || hostOf(task.deliverable_url)}
            </a>
          ) : null}

          {canEdit ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn-quiet"
            >
              Edit
            </button>
          ) : null}

          {canDelete ? (
            <form action={deleteTask}>
              <input type="hidden" name="id" value={task.id} />
              <button
                type="submit"
                className="btn-quiet hover:text-clay"
                aria-label={`Delete ${task.title}`}
              >
                Delete
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </li>
  );
}
