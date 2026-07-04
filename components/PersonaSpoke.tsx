import Link from "next/link";
import type { Persona } from "@/config/personas";
import { PRODUCT_SUBDOMAIN } from "@/config/product";
import { JsonLd } from "@/components/JsonLd";

export function PersonaSpoke({ persona, other }: { persona: Persona; other: Persona }) {
  const base = `https://${PRODUCT_SUBDOMAIN}`;
  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Who is TrustScope for?",
              item: `${base}/for`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: persona.spoke.title,
              item: `${base}${persona.spokeHref}`,
            },
          ],
        }}
      />
      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-5 pb-6 pt-20 text-center sm:pt-28">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {persona.tag}
          </span>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {persona.spoke.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">{persona.spoke.jtbd}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          What makes this hard
        </h2>
        <ul className="mt-4 space-y-2 text-[15px] leading-relaxed text-muted">
          {persona.spoke.pains.map((p) => (
            <li key={p} className="before:mr-2 before:text-brand before:content-['—']">
              {p}
            </li>
          ))}
        </ul>
        <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-muted">
          How TrustScope helps
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-foreground/90">
          {persona.spoke.perPillar}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{persona.spoke.walkthrough}</p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href={persona.ctaHref}
            className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {persona.ctaLabel} →
          </Link>
          <Link
            href={other.spokeHref}
            className="inline-flex items-center rounded-lg border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium transition-colors hover:border-brand/40"
          >
            {other.spoke.title} →
          </Link>
          <Link
            href="/for"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Who is TrustScope for? ↑
          </Link>
        </div>
      </section>
    </div>
  );
}
