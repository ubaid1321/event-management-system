"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

/** Only same-origin paths may be used as a post-login destination. */
function safeNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/overview";
  if (!value.startsWith("/") || value.startsWith("//")) return "/overview";
  return value;
}

export async function signIn(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password.", ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase returns the same error for a wrong password and an unknown
    // account, which is what we want: it does not confirm who has an account.
    return { error: "That email and password don't match an account.", ok: false };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
