import Link from "next/link";
import type { Persona } from "@/config/personas";

export function PersonaCard({ persona }: { persona: Persona }) {
  return (
    <div
      className={`rounded-2xl border border-t-2 border-border bg-surface/60 p-6 ${persona.accent}`}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
        {persona.tag}
      </span>
      <h2 className="mt-2 text-xl font-semibold leading-snug tracking-tight">
        {persona.recognition}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{persona.youIf}</p>
      <div className="mt-5 flex flex-col items-start gap-3">
        <Link
          href={persona.ctaHref}
          className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          {persona.ctaLabel} →
        </Link>
        <Link
          href={persona.spokeHref}
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          Learn more →
        </Link>
      </div>
    </div>
  );
}
