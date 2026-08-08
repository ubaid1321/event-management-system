/**
 * VMI Collective wordmark. The rule between "VMI" and "COLLECTIVE" is the same
 * meridian device used by the countdown band — one idea, reused quietly.
 */
export function Wordmark({ tone = "rail" }: { tone?: "rail" | "ink" }) {
  const primary = tone === "rail" ? "text-rail-ink" : "text-ink";
  const secondary = tone === "rail" ? "text-rail-ink-2" : "text-ink-3";

  return (
    <span className="inline-flex items-baseline gap-2.5 select-none">
      <span
        className={`font-display text-[1.0625rem] leading-none font-semibold tracking-tight ${primary}`}
      >
        VMI
      </span>
      <span aria-hidden className={`h-px w-4 self-center ${secondary} bg-current opacity-45`} />
      <span
        className={`font-mono text-[0.625rem] leading-none tracking-[0.22em] uppercase ${secondary}`}
      >
        Collective
      </span>
    </span>
  );
}
