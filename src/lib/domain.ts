import type {
  Department,
  TaskPriority,
  TaskStatus,
} from "@/lib/supabase/types";

export interface DepartmentMeta {
  value: Department;
  label: string;
  /** What this team is responsible for. Used on empty boards. */
  remit: string;
  text: string;
  bg: string;
  border: string;
  dot: string;
}

export const DEPARTMENTS: DepartmentMeta[] = [
  {
    value: "content",
    label: "Content",
    remit: "Programme, copy, speakers and everything written.",
    text: "text-brass",
    bg: "bg-brass-soft",
    border: "border-brass/35",
    dot: "bg-brass",
  },
  {
    value: "design",
    label: "Design",
    remit: "Identity, decks, signage and social artwork.",
    text: "text-clay",
    bg: "bg-clay-soft",
    border: "border-clay/35",
    dot: "bg-clay",
  },
  {
    value: "analyst",
    label: "Analyst",
    remit: "Research, registration data and reporting.",
    text: "text-jade",
    bg: "bg-jade-soft",
    border: "border-jade/35",
    dot: "bg-jade",
  },
  {
    value: "developer",
    label: "Developer",
    remit: "Site, forms, integrations and this dashboard.",
    // Teal, not blue: blue now belongs to the brand accent, and a blue team
    // dot beside a blue link would read as the same thing.
    text: "text-teal",
    bg: "bg-teal-soft",
    border: "border-teal/35",
    dot: "bg-teal",
  },
  {
    value: "marketing",
    label: "Marketing",
    remit: "Outreach, campaigns, partnerships and ticket sales.",
    text: "text-plum",
    bg: "bg-plum-soft",
    border: "border-plum/35",
    dot: "bg-plum",
  },
];

export const DEPARTMENT_BY_VALUE = new Map(
  DEPARTMENTS.map((department) => [department.value, department]),
);

export function departmentMeta(value: Department | null | undefined) {
  return value ? DEPARTMENT_BY_VALUE.get(value) : undefined;
}

export interface TaskStatusMeta {
  value: TaskStatus;
  label: string;
  /** Column subtitle on the board. Says what being here means. */
  hint: string;
  className: string;
}

export const TASK_STATUSES: TaskStatusMeta[] = [
  {
    value: "todo",
    label: "To do",
    hint: "Not started",
    className: "bg-surface-2 text-ink-2 border-line-strong",
  },
  {
    value: "in_progress",
    label: "In progress",
    hint: "Someone is on it",
    className: "bg-brand-soft text-brand border-brand/35",
  },
  {
    value: "in_review",
    label: "In review",
    hint: "With a reviewer",
    className: "bg-brass-soft text-brass border-brass/35",
  },
  {
    value: "blocked",
    label: "Blocked",
    hint: "Waiting on something",
    className: "bg-clay-soft text-clay border-clay/35",
  },
  {
    value: "done",
    label: "Done",
    hint: "Delivered",
    className: "bg-jade-soft text-jade border-jade/35",
  },
];

export const TASK_STATUS_BY_VALUE = new Map(
  TASK_STATUSES.map((status) => [status.value, status]),
);

export const TASK_PRIORITIES: {
  value: TaskPriority;
  label: string;
  className: string;
}[] = [
  { value: "low", label: "Low", className: "text-ink-3" },
  { value: "normal", label: "Normal", className: "text-ink-2" },
  { value: "high", label: "High", className: "text-clay" },
];

export function isDepartment(value: unknown): value is Department {
  return (
    typeof value === "string" &&
    DEPARTMENTS.some((department) => department.value === value)
  );
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    TASK_STATUSES.some((status) => status.value === value)
  );
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === "string" &&
    TASK_PRIORITIES.some((priority) => priority.value === value)
  );
}
