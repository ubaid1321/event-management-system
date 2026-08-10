"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signIn } from "@/app/auth/actions";
import { emptyFormState } from "@/lib/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 h-11 w-full rounded-[var(--radius-control)] bg-brand font-mono text-[0.6875rem] tracking-[0.16em] text-white uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signIn, emptyFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className="h-11 rounded-[var(--radius-control)] border border-rail-line bg-rail-2 px-3 text-[0.9375rem] text-rail-ink placeholder:text-rail-ink-2/60"
          placeholder="you@vmicollective.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 rounded-[var(--radius-control)] border border-rail-line bg-rail-2 px-3 text-[0.9375rem] text-rail-ink"
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-control)] border border-clay/40 bg-clay/10 px-3 py-2.5 text-[0.8125rem] text-clay"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
