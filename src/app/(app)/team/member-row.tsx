"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  setMemberDepartment,
  updateTeamMember,
} from "@/app/(app)/team/actions";
import { DEPARTMENTS, departmentMeta } from "@/lib/domain";
import { emptyFormState } from "@/lib/form-state";
import { initials } from "@/lib/people";
import type { TeamMember } from "@/lib/tasks";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

interface MemberRowProps {
  member: TeamMember;
  openTaskCount: number;
  isAdmin: boolean;
  isSelf: boolean;
}

export function MemberRow({
  member,
  openTaskCount,
  isAdmin,
  isSelf,
}: MemberRowProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(updateTeamMember, emptyFormState);

  // Close the editor once the save lands. See the note in task-item.tsx.
  const [sawSave, setSawSave] = useState(state.ok);
  if (state.ok !== sawSave) {
    setSawSave(state.ok);
    if (state.ok) setEditing(false);
  }

  const name = member.full_name?.trim() || member.email || "Unnamed";
  const meta = departmentMeta(member.department);

  if (editing) {
    return (
      <li className="border-b border-line p-5 last:border-b-0">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={member.id} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={`name-${member.id}`} className="label">
                Full name
              </label>
              <input
                id={`name-${member.id}`}
                name="full_name"
                defaultValue={member.full_name ?? ""}
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`title-${member.id}`} className="label">
                Job title
              </label>
              <input
                id={`title-${member.id}`}
                name="title"
                defaultValue={member.title ?? ""}
                placeholder="Content lead"
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`dept-${member.id}`} className="label">
                Team
              </label>
              <select
                id={`dept-${member.id}`}
                name="department"
                defaultValue={member.department ?? ""}
                className="input"
              >
                <option value="">No team (admin)</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department.value} value={department.value}>
                    {department.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`role-${member.id}`} className="label">
                Role
              </label>
              <select
                id={`role-${member.id}`}
                name="role"
                defaultValue={member.role}
                className="input"
              >
                <option value="member">Member: adds and completes tasks</option>
                <option value="admin">Admin: assigns work, edits event</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-[0.875rem] text-ink-2">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={member.is_active}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            Working on this event
          </label>

          {state.error ? (
            <p
              role="alert"
              className="rounded-[var(--radius-control)] border border-clay/40 bg-clay-soft px-3 py-2.5 text-[0.8125rem] text-clay"
            >
              {state.error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Submit />
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-4 border-b border-line p-4 last:border-b-0">
      <span
        aria-hidden
        className={`tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-[0.6875rem] ${
          meta ? `${meta.bg} ${meta.text} ${meta.border}` : "border-line-strong bg-surface-2 text-ink-3"
        }`}
      >
        {initials(name)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[0.9375rem] text-ink">
          {name}
          {!member.is_active ? (
            <span className="font-mono text-[0.625rem] tracking-[0.1em] text-ink-3 uppercase">
              Inactive
            </span>
          ) : null}
          {member.role === "admin" ? (
            <span className="rounded-full border border-brand/35 bg-brand-soft px-2 py-0.5 font-mono text-[0.5625rem] tracking-[0.12em] text-brand uppercase">
              Admin
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 truncate font-mono text-[0.6875rem] tracking-[0.06em] text-ink-3">
          {[member.title, meta?.label, member.email]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <span className="tnum font-mono text-[0.6875rem] tracking-[0.08em] text-ink-3">
        {openTaskCount} open
      </span>

      {/* Assigning a team is the common case, so it happens right here. */}
      {isAdmin ? (
        <form action={setMemberDepartment}>
          <input type="hidden" name="id" value={member.id} />
          <select
            name="department"
            defaultValue={member.department ?? ""}
            aria-label={`Team for ${name}`}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className={`h-8 cursor-pointer rounded-[var(--radius-control)] border px-2 font-mono text-[0.6875rem] tracking-[0.06em] ${
              member.department
                ? "border-line-strong bg-surface text-ink-2"
                : "border-brand/50 bg-brand-soft text-brand"
            }`}
          >
            <option value="">Pick a team</option>
            {DEPARTMENTS.map((department) => (
              <option key={department.value} value={department.value}>
                {department.label}
              </option>
            ))}
          </select>
        </form>
      ) : null}

      {isAdmin ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn-quiet"
        >
          {isSelf ? "Edit yours" : "Edit"}
        </button>
      ) : null}
    </li>
  );
}
