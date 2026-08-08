import type { Metadata } from "next";

import { LoginForm } from "@/app/login/login-form";
import { SetupNotice } from "@/components/setup-notice";
import { Wordmark } from "@/components/wordmark";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
};

function safeNext(value: string | string[] | undefined) {
  if (typeof value !== "string") return "/overview";
  if (!value.startsWith("/") || value.startsWith("//")) return "/overview";
  return value;
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <main className="on-dark relative flex min-h-dvh items-center justify-center overflow-hidden bg-rail px-5 py-12">
      {/* Ambient meridian field — the same ruled language as the countdown. */}
      <div aria-hidden className="meridian-field absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brass/[0.07] to-transparent"
      />

      <div className="relative w-full max-w-[25rem] rise">
        <div className="mb-9 flex flex-col items-start gap-6">
          <Wordmark />
          <div>
            <h1 className="font-display text-[2rem] leading-[1.1] font-medium text-rail-ink">
              Event management
            </h1>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-rail-ink-2">
              Sign in to manage World Wisdom Connect.
            </p>
          </div>
        </div>

        <LoginForm next={next} />

        <p className="mt-8 border-t border-rail-line pt-5 text-[0.8125rem] leading-relaxed text-rail-ink-2">
          Accounts are created by the VMI Collective team. Need access? Ask an
          admin to add you.
        </p>
      </div>
    </main>
  );
}
