import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/types";

export interface Session {
  userId: string;
  email: string;
  name: string;
  profile: ProfileRow | null;
  isAdmin: boolean;
}

/**
 * The signed-in person plus their profile row. Redirects to /login when there
 * is no session, so pages can treat the result as guaranteed.
 */
export async function requireSession(): Promise<Session> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const typedProfile = (profile as ProfileRow | null) ?? null;
  const email = typedProfile?.email ?? user.email ?? "";

  return {
    userId: user.id,
    email,
    name: typedProfile?.full_name?.trim() || email.split("@")[0] || "Signed in",
    profile: typedProfile,
    isAdmin: typedProfile?.role === "admin",
  };
}

// Display helpers live in @/lib/people so client components can import them
// without dragging this server-only module along.
export { displayName, initials } from "@/lib/people";
