"use client";

import { useActionState, useState } from "react";

import {
  approveTask,
  deleteTask,
  requestChanges,
  sendForReview,
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
  loadByPerson?: Record<string, number>;
  canEdit: boolean;
  canDelete: boolean;
  /** True when the signed-in person is this task's reviewer (or an admin). */
  canReview?: boolean;
}

function personName(person: TeamMember | null) {
  return person?.full_name?.trim() || person?.email || null;
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Open link";
  }
}

export function TaskItem({
  task,
  team,
  loadByPerson,
  canEdit,
  canDelete,
  canReview = false,
}: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [state, formAction] = useActionState(updateTask, emptyFormState);
  const [sendState, sendAction] = useActionState(sendForReview, emptyFormState);

  const [sawSend, setSawSend] = useState(sendState.ok);
  if (sendState.ok !== sawSend) {
    setSawSend(sendState.ok);
    if (sendState.ok) setReviewing(false);
  }

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
  const assigneeName = personName(task.assignee);
  const reviewerName = personName(task.reviewer);

  const today = new Date().toISOString().slice(0, 10);
  const overdue = task.status !== "done" && !!task.due_on && task.due_on < today;

  const inReview = task.status === "in_review";
  const canSendForReview =
    canEdit && !inReview && task.status !== "done" && task.status !== "blocked";

  if (editing) {
    return (
      <li className="border-b border-line p-5 last:border-b-0">
        <form action={formAction}>
          <input type="hidden" name="id" value={task.id} />
          <TaskFields
            idPrefix={`edit-${task.id}`}
            task={task}
            team={team}
            loadByPerson={loadByPerson}
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
              <option
                key={option.value}
                value={option.value}
                /* Reaching review needs a reviewer, so it goes through the
                   Send for review control rather than this menu. */
                disabled={option.value === "in_review"}
              >
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

            {inReview && reviewerName ? (
              <span className="text-brass">With {reviewerName}</span>
            ) : null}

            {task.completed_at ? (
              <span className="text-jade">
                Delivered {formatDate(task.completed_at)}
              </span>
            ) : null}
          </div>

          {task.review_note && task.status === "in_progress" ? (
            <p className="mt-2.5 border-l-2 border-clay/50 pl-3 text-[0.8125rem] leading-relaxed text-ink-2">
              <span className="label mr-2 text-clay">Changes asked</span>
              {task.review_note}
            </p>
          ) : null}

          {/* Reviewer's controls: approve, or send it back with a reason. */}
          {inReview && canReview ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <form action={approveTask}>
                <input type="hidden" name="id" value={task.id} />
                <button type="submit" className="btn-primary">
                  Approve
                </button>
              </form>
              <form
                action={requestChanges}
                className="flex flex-1 flex-wrap items-center gap-2"
              >
                <input type="hidden" name="id" value={task.id} />
                <input
                  name="review_note"
                  placeholder="What needs changing?"
                  aria-label={`What needs changing on ${task.title}`}
                  className="input h-9 min-w-48 flex-1"
                />
                <button type="submit" className="btn-secondary">
                  Request changes
                </button>
              </form>
            </div>
          ) : null}

          {/* Owner's control: hand it to a reviewer. */}
          {reviewing ? (
            <form
              action={sendAction}
              className="mt-3 flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="id" value={task.id} />
              <select
                name="reviewer_id"
                defaultValue={task.reviewer_id ?? ""}
                aria-label={`Reviewer for ${task.title}`}
                className="input h-9 w-auto min-w-48"
              >
                <option value="">Choose a reviewer…</option>
                {team
                  .filter((member) => member.is_active)
                  .map((member) => {
                    const name = member.full_name?.trim() || member.email;
                    const load = loadByPerson?.[member.id];
                    return (
                      <option key={member.id} value={member.id}>
                        {load === undefined ? name : `${name} — ${load} open`}
                      </option>
                    );
                  })}
              </select>
              <button type="submit" className="btn-primary">
                Send
              </button>
              <button
                type="button"
                onClick={() => setReviewing(false)}
                className="btn-quiet"
              >
                Cancel
              </button>
              {sendState.error ? (
                <span role="alert" className="text-[0.8125rem] text-clay">
                  {sendState.error}
                </span>
              ) : null}
            </form>
          ) : null}
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

          {canSendForReview && !reviewing ? (
            <button
              type="button"
              onClick={() => setReviewing(true)}
              className="btn-quiet"
            >
              Send for review
            </button>
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
