import type { ProfileRow } from "@/lib/supabase/types";

/**
 * Pure display helpers for people. Deliberately free of server-only imports so
 * client components can use them too.
 */

/** Display name for a profile, falling back through email to null. */
export function displayName(
  profile: Pick<ProfileRow, "full_name" | "email"> | null | undefined,
) {
  if (!profile) return null;
  const name = profile.full_name?.trim();
  if (name) return name;
  return profile.email?.split("@")[0] ?? null;
}

/** "AB" for Ada Bell, "A" for Ada. Used by the assignee chips. */
export function initials(value: string | null | undefined) {
  if (!value) return "?";
  const parts = value.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}
