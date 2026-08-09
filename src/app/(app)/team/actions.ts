"use server";

import { revalidatePath } from "next/cache";

import { isDepartment } from "@/lib/domain";
import type { FormState } from "@/lib/form-state";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin edit of one teammate's roster entry: name, job title, team, role and
 * whether they are still active. Accounts themselves are created in Supabase
 * Auth. This only maintains the profile attached to them.
 */
/**
 * Put one person on a team, straight from the roster row.
 *
 * Placing people is the single most common roster edit, and every new account
 * starts with no team, so it gets its own one-click control rather than making
 * an admin open the full edit form five times.
 */
export async function setMemberDepartment(formData: FormData) {
  const session = await requireSession();
  if (!session.isAdmin) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const raw = formData.get("department");
  const department = raw === "" || raw === null ? null : raw;
  if (department !== null && !isDepartment(department)) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ department }).eq("id", id);

  revalidatePath("/team");
  revalidatePath("/tasks");
}

export async function updateTeamMember(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (!session.isAdmin) {
    return { error: "Only an admin can change the roster.", ok: false };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Missing person. Reload the page and try again.", ok: false };
  }

  const departmentValue = formData.get("department");
  const department =
    departmentValue === "" || departmentValue === null
      ? null
      : isDepartment(departmentValue)
        ? departmentValue
        : undefined;

  if (department === undefined) {
    return { error: "Pick a team, or leave it blank for admins.", ok: false };
  }

  const roleValue = String(formData.get("role") ?? "member");
  if (roleValue !== "admin" && roleValue !== "member") {
    return { error: "Role must be admin or member.", ok: false };
  }

  // An admin must not remove their own admin rights, which can lock everyone
  // out of assigning work with no way back except SQL.
  if (id === session.userId && roleValue !== "admin") {
    return {
      error: "You can't remove your own admin access. Ask another admin.",
      ok: false,
    };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      title: title || null,
      department,
      role: roleValue,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);

  if (error) {
    return { error: `Couldn't save: ${error.message}`, ok: false };
  }

  revalidatePath("/team");
  revalidatePath("/tasks");
  return { error: null, ok: true };
}
