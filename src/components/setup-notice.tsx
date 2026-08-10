import { Wordmark } from "@/components/wordmark";

const STEPS = [
  {
    title: "Create a Supabase project",
    body: "Go to supabase.com/dashboard, create a project for VMI Collective, and wait for it to finish provisioning.",
  },
  {
    title: "Run the schema",
    body: "In the Supabase SQL Editor, run supabase/migrations/0001_init.sql, then 0002_seed_wwc.sql.",
  },
  {
    title: "Turn off public signup",
    body: "Authentication → Sign In / Providers → Email: switch off “Allow new users to sign up”. Only accounts you create can reach this dashboard.",
  },
  {
    title: "Add your keys",
    body: "Copy .env.local.example to .env.local and paste the Project URL and the publishable (anon) key from Project Settings → API. Then restart the dev server.",
  },
] as const;

export function SetupNotice() {
  return (
    <main className="on-dark relative flex min-h-dvh items-center justify-center overflow-hidden bg-rail px-5 py-12">
      <div aria-hidden className="meridian-field absolute inset-0" />

      <div className="relative w-full max-w-[34rem]">
        <Wordmark />

        <h1 className="mt-8 font-display text-[2rem] leading-[1.15] font-medium text-rail-ink">
          Connect Supabase to finish setup
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-rail-ink-2">
          The dashboard is built and waiting. It needs a database and an auth
          provider before anyone can sign in.
        </p>

        <ol className="mt-9 flex flex-col">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-5 border-t border-rail-line py-5 last:border-b"
            >
              <span className="tnum font-mono text-[0.75rem] text-brand">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-[0.9375rem] text-rail-ink">{step.title}</p>
                <p className="mt-1.5 text-[0.875rem] leading-relaxed text-rail-ink-2">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-7 font-mono text-[0.6875rem] tracking-[0.12em] text-rail-ink-2 uppercase">
          Full walkthrough in README.md
        </p>
      </div>
    </main>
  );
}
