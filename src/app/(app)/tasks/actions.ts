"use server";

import { revalidatePath } from "next/cache";

import {
  isDepartment,
  isTaskPriority,
  isTaskStatus,
} from "@/lib/domain";
import type { FormState } from "@/lib/form-state";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { TaskRow } from "@/lib/supabase/types";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Only http(s) links. A deliverable link is something you click. */
function link(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return { url: null as string | null, error: null as string | null };
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("bad protocol");
    }
    return { url: parsed.toString(), error: null };
  } catch {
    return {
      url: null,
      error: "That deliverable link isn't a valid web address.",
    };
  }
}

interface ParsedTask {
  values: Partial<TaskRow>;
  error: string | null;
}

function parseTask(formData: FormData): ParsedTask {
  const title = text(formData, "title");
  if (!title) {
    return { values: {}, error: "Give the task a title." };
  }

  const department = formData.get("department");
  if (!isDepartment(department)) {
    return { values: {}, error: "Pick a team for this task." };
  }

  const status = formData.get("status");
  if (!isTaskStatus(status)) {
    return { values: {}, error: "Pick a status for this task." };
  }

  const priority = formData.get("priority");
  if (!isTaskPriority(priority)) {
    return { values: {}, error: "Pick a priority for this task." };
  }

  const deliverable = link(formData, "deliverable_url");
  if (deliverable.error) {
    return { values: {}, error: deliverable.error };
  }

  const reviewerId = text(formData, "reviewer_id");
  if (status === "in_review" && !reviewerId) {
    return {
      values: {},
      error: "Pick who should review this before sending it for review.",
    };
  }

  return {
    error: null,
    values: {
      title,
      description: text(formData, "description"),
      department,
      status,
      priority,
      assignee_id: text(formData, "assignee_id"),
      reviewer_id: reviewerId,
      due_on: text(formData, "due_on"),
      deliverable_url: deliverable.url,
      deliverable_label: text(formData, "deliverable_label"),
    },
  };
}

export async function createTask(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const eventId = String(formData.get("event_id") ?? "");
  if (!eventId) {
    return { error: "Missing event. Reload the page and try again.", ok: false };
  }

  const { values, error } = parseTask(formData);
  if (error) return { error, ok: false };

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("tasks").insert({
    ...values,
    title: values.title!,
    event_id: eventId,
    created_by: session.userId,
  });

  if (insertError) {
    return { error: `Couldn't add the task: ${insertError.message}`, ok: false };
  }

  revalidatePath("/tasks");
  revalidatePath("/overview");
  return { error: null, ok: true };
}

export async function updateTask(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Missing task. Reload the page and try again.", ok: false };
  }

  const { values, error } = parseTask(formData);
  if (error) return { error, ok: false };

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("tasks")
    .update(values)
    .eq("id", id);

  if (updateError) {
    return {
      error: `Couldn't save the task: ${updateError.message}`,
      ok: false,
    };
  }

  revalidatePath("/tasks");
  revalidatePath("/overview");
  return { error: null, ok: true };
}

function revalidateBoards() {
  revalidatePath("/tasks");
  revalidatePath("/overview");
}

/**
 * Quick status change straight from the board.
 *
 * "in_review" is deliberately not reachable here. It needs a reviewer, so it
 * goes through Send for review instead.
 */
export async function setTaskStatus(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");

  if (!id || !isTaskStatus(status) || status === "in_review") return;

  const supabase = await createClient();
  // completed_at is maintained by the tasks_sync_completion trigger.
  await supabase.from("tasks").update({ status }).eq("id", id);

  revalidateBoards();
}

/** Hand finished work to a named reviewer. */
export async function sendForReview(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const reviewerId = text(formData, "reviewer_id");

  if (!id) {
    return { error: "Missing task. Reload the page and try again.", ok: false };
  }
  if (!reviewerId) {
    return { error: "Choose who should review this.", ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: "in_review", reviewer_id: reviewerId })
    .eq("id", id);

  if (error) {
    return { error: `Couldn't send for review: ${error.message}`, ok: false };
  }

  revalidateBoards();
  return { error: null, ok: true };
}

/** Reviewer signs the work off. The trigger stamps completed_at. */
export async function approveTask(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("tasks").update({ status: "done" }).eq("id", id);

  revalidateBoards();
}

/** Reviewer sends it back, with a note saying what needs changing. */
export async function requestChanges(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({
      status: "in_progress",
      review_note: text(formData, "review_note"),
    })
    .eq("id", id);

  revalidateBoards();
}

/**
 * Admins delete anything; everyone else may withdraw a task they raised.
 * RLS enforces the same rule, so this check is the friendly half of it.
 */
export async function deleteTask(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const query = supabase.from("tasks").delete().eq("id", id);
  if (!session.isAdmin) {
    query.eq("created_by", session.userId);
  }
  await query;

  revalidateBoards();
}
