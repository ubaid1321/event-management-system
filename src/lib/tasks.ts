import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Department,
  ProfileRow,
  TaskRow,
  TaskStatus,
} from "@/lib/supabase/types";

export type TeamMember = Pick<
  ProfileRow,
  "id" | "full_name" | "email" | "role" | "department" | "title" | "is_active"
>;

export interface TaskWithPeople extends TaskRow {
  assignee: TeamMember | null;
  creator: TeamMember | null;
  reviewer: TeamMember | null;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  blocked: number;
  done: number;
  overdue: number;
  /** 0–100, or null when there are no tasks yet. */
  percentDone: number | null;
  byDepartment: Record<Department, { total: number; done: number }>;
}

/** What one person is personally on the hook for. */
export interface MyWork {
  /** Assigned to me and not finished, soonest due first. */
  assigned: TaskWithPeople[];
  /** Sitting in my review queue, waiting on me to approve or send back. */
  toReview: TaskWithPeople[];
  /** Mine, past their due date, still not delivered. */
  overdue: TaskWithPeople[];
}

export async function getTeam(): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, department, title, is_active")
    .order("full_name", { ascending: true, nullsFirst: false });
  return (data as TeamMember[] | null) ?? [];
}

export async function getTasks(eventId: string): Promise<TaskWithPeople[]> {
  const supabase = await createClient();

  const [{ data: tasks }, team] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("event_id", eventId)
      .order("due_on", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    getTeam(),
  ]);

  const byId = new Map(team.map((member) => [member.id, member]));

  return ((tasks as TaskRow[] | null) ?? []).map((task) =>
    withPeople(task, byId),
  );
}

function withPeople(task: TaskRow, byId: Map<string, TeamMember>) {
  return {
    ...task,
    assignee: task.assignee_id ? (byId.get(task.assignee_id) ?? null) : null,
    creator: task.created_by ? (byId.get(task.created_by) ?? null) : null,
    reviewer: task.reviewer_id ? (byId.get(task.reviewer_id) ?? null) : null,
  };
}

/**
 * Open (unfinished) task count per assignee. Shown beside names in the
 * reviewer picker so work goes to whoever actually has room for it.
 */
export function openTaskCountByPerson(tasks: TaskWithPeople[]) {
  const counts: Record<string, number> = {};
  for (const task of tasks) {
    if (task.status === "done" || !task.assignee_id) continue;
    counts[task.assignee_id] = (counts[task.assignee_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Everything one person needs to see the moment they sign in: what is on them,
 * and what is blocked behind their review.
 */
export function selectMyWork(
  tasks: TaskWithPeople[],
  userId: string,
): MyWork {
  const today = new Date().toISOString().slice(0, 10);

  const assigned = tasks.filter(
    (task) => task.assignee_id === userId && task.status !== "done",
  );

  return {
    assigned,
    toReview: tasks.filter(
      (task) => task.reviewer_id === userId && task.status === "in_review",
    ),
    overdue: assigned.filter((task) => !!task.due_on && task.due_on < today),
  };
}

export async function getTask(id: string): Promise<TaskWithPeople | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const task = data as TaskRow | null;
  if (!task) return null;

  const team = await getTeam();
  const byId = new Map(team.map((member) => [member.id, member]));

  return withPeople(task, byId);
}

const DEPARTMENT_KEYS: Department[] = [
  "content",
  "design",
  "analyst",
  "developer",
  "marketing",
];

export function summariseTasks(tasks: TaskWithPeople[]): TaskStats {
  const byDepartment = Object.fromEntries(
    DEPARTMENT_KEYS.map((key) => [key, { total: 0, done: 0 }]),
  ) as TaskStats["byDepartment"];

  const stats: TaskStats = {
    total: tasks.length,
    todo: 0,
    inProgress: 0,
    inReview: 0,
    blocked: 0,
    done: 0,
    overdue: 0,
    percentDone: null,
    byDepartment,
  };

  const today = new Date().toISOString().slice(0, 10);

  for (const task of tasks) {
    const status = task.status as TaskStatus;
    if (status === "todo") stats.todo += 1;
    if (status === "in_progress") stats.inProgress += 1;
    if (status === "in_review") stats.inReview += 1;
    if (status === "blocked") stats.blocked += 1;
    if (status === "done") stats.done += 1;
    if (status !== "done" && task.due_on && task.due_on < today) {
      stats.overdue += 1;
    }

    const bucket = byDepartment[task.department];
    if (bucket) {
      bucket.total += 1;
      if (status === "done") bucket.done += 1;
    }
  }

  if (stats.total > 0) {
    stats.percentDone = Math.round((stats.done / stats.total) * 100);
  }

  return stats;
}
