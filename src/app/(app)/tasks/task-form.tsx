"use client";

import { useFormStatus } from "react-dom";

import { DEPARTMENTS, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/domain";
import type { TeamMember } from "@/lib/tasks";
import type { TaskRow } from "@/lib/supabase/types";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving…" : label}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[0.75rem] text-ink-3">{hint}</p> : null}
    </div>
  );
}

export interface TaskFormProps {
  idPrefix: string;
  task?: TaskRow | null;
  team: TeamMember[];
  /** Locks the department when adding from inside a team's section. */
  defaultDepartment?: string;
  submitLabel: string;
  error?: string | null;
  onCancel?: () => void;
}

export function TaskFields({
  idPrefix,
  task,
  team,
  defaultDepartment,
  submitLabel,
  error,
  onCancel,
}: TaskFormProps) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const assignable = team.filter(
    (member) => member.is_active || member.id === task?.assignee_id,
  );

  return (
    <div className="flex flex-col gap-4">
      <Field label="Task" htmlFor={id("title")}>
        <input
          id={id("title")}
          name="title"
          required
          maxLength={200}
          defaultValue={task?.title ?? ""}
          placeholder="Write the speaker invitation email"
          className="input"
        />
      </Field>

      <Field label="Details" htmlFor={id("description")}>
        <textarea
          id={id("description")}
          name="description"
          rows={3}
          defaultValue={task?.description ?? ""}
          placeholder="What does done look like?"
          className="textarea"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Team" htmlFor={id("department")}>
          <select
            id={id("department")}
            name="department"
            defaultValue={task?.department ?? defaultDepartment ?? "content"}
            className="input"
          >
            {DEPARTMENTS.map((department) => (
              <option key={department.value} value={department.value}>
                {department.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Assigned to" htmlFor={id("assignee")}>
          <select
            id={id("assignee")}
            name="assignee_id"
            defaultValue={task?.assignee_id ?? ""}
            className="input"
          >
            <option value="">Nobody yet</option>
            {assignable.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name?.trim() || member.email}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" htmlFor={id("status")}>
          <select
            id={id("status")}
            name="status"
            defaultValue={task?.status ?? "todo"}
            className="input"
          >
            {TASK_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priority" htmlFor={id("priority")}>
          <select
            id={id("priority")}
            name="priority"
            defaultValue={task?.priority ?? "normal"}
            className="input"
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Due" htmlFor={id("due")}>
          <input
            id={id("due")}
            name="due_on"
            type="date"
            defaultValue={task?.due_on ?? ""}
            className="input"
          />
        </Field>

        <Field
          label="Link name"
          htmlFor={id("deliverable-label")}
          hint="Optional. Shown instead of the raw address."
        >
          <input
            id={id("deliverable-label")}
            name="deliverable_label"
            maxLength={60}
            defaultValue={task?.deliverable_label ?? ""}
            placeholder="Drive folder"
            className="input"
          />
        </Field>
      </div>

      <Field
        label="Deliverable link"
        htmlFor={id("deliverable-url")}
        hint="Where the finished work lives — a Drive folder, Figma file, doc or repo."
      >
        <input
          id={id("deliverable-url")}
          name="deliverable_url"
          type="url"
          inputMode="url"
          defaultValue={task?.deliverable_url ?? ""}
          placeholder="https://drive.google.com/drive/folders/…"
          className="input"
        />
      </Field>

      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-control)] border border-clay/40 bg-clay-soft px-3 py-2.5 text-[0.8125rem] text-clay"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2 pt-1">
        <Submit label={submitLabel} />
        {onCancel ? (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
