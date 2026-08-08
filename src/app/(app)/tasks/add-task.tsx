"use client";

import { useActionState, useState } from "react";

import { createTask } from "@/app/(app)/tasks/actions";
import { TaskFields } from "@/app/(app)/tasks/task-form";
import { emptyFormState } from "@/lib/form-state";
import type { TeamMember } from "@/lib/tasks";

interface AddTaskProps {
  eventId: string;
  team: TeamMember[];
  defaultDepartment?: string;
  label?: string;
}

export function AddTask({
  eventId,
  team,
  defaultDepartment,
  label = "Add task",
}: AddTaskProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createTask, emptyFormState);

  // Collapse the form once the task is saved. Unmounting it also clears the
  // fields, so the next task starts from a blank slate.
  const [sawSave, setSawSave] = useState(state.ok);
  if (state.ok !== sawSave) {
    setSawSave(state.ok);
    if (state.ok) setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary"
      >
        {label}
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full rounded-[var(--radius-card)] border border-line-strong bg-surface-2 p-5"
    >
      <input type="hidden" name="event_id" value={eventId} />
      <TaskFields
        idPrefix={`new-${defaultDepartment ?? "task"}`}
        team={team}
        defaultDepartment={defaultDepartment}
        submitLabel="Add task"
        error={state.error}
        onCancel={() => setOpen(false)}
      />
    </form>
  );
}
