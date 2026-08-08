import { NavRail, type NavEvent } from "@/components/nav-rail";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  // requireSession redirects to /login when there is no session. The proxy
  // does this too — this is the second lock, inside the layout that renders
  // the data, so no page can leak by being reached another way.
  const session = await requireSession();

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("slug, name, status")
    .order("starts_at", { ascending: true, nullsFirst: false });

  return (
    <div className="min-h-dvh">
      <NavRail
        events={(events ?? []) as NavEvent[]}
        userName={session.name}
        userEmail={session.email}
        isAdmin={session.isAdmin}
      />
      <div className="lg:pl-62">
        <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
