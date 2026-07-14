import Link from "next/link";
import type { Persona } from "@/config/personas";
import { PRODUCT_SUBDOMAIN } from "@/config/product";
import { PILLARS_META } from "@/config/pillars";
import { JsonLd } from "@/components/JsonLd";
import { RepoForm } from "@/components/RepoForm";
import { FaqAccordion } from "@/components/FaqAccordion";

/**
 * Shared persona subpage template (2026-07-06 redesign). One layout, two
 * personas — content + accent (`--accent`) come from config/personas.ts.
 * Sections: hero + repo picker → who does what → how TrustScope helps
 * (2×2 pillars + verdict light) → persona FAQ accordion.
 */
export function PersonaSpoke({ persona, other }: { persona: Persona; other: Persona }) {
  const base = `https://${PRODUCT_SUBDOMAIN}`;
  const s = persona.spoke;
  return (
    <div
      style={{
        ["--accent" as string]: s.accentHex,
        ["--accent-light" as string]: s.accentHexLight,
        ["--accent-ink" as string]: s.accentInk,
      }}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: base },
            {
              "@type": "ListItem",
              position: 2,
              name: s.title,
              item: `${base}${persona.spokeHref}`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: s.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      {/* Hero + repo picker */}
      <section className="hero-glow">
        <div className="mx-auto max-w-2xl px-5 pb-6 pt-20 text-center sm:pt-24">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] light:text-[var(--accent-light)]">
            {persona.tag}
          </span>
          <h1 className="mx-auto mt-3 max-w-[22ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {s.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[15px] text-muted">{s.heroLede}</p>
          <div className="mx-auto mt-6 max-w-md text-left">
            <RepoForm
              submitClassName="bg-[var(--accent)] text-[var(--accent-ink)] transition-opacity hover:opacity-90"
              submitLabel={s.submitLabel}
              placeholder={s.placeholder}
            />
          </div>
          <p className="mt-3.5 text-[13px] text-muted">
            {s.crossLinkLead}{" "}
            <Link
              href={other.spokeHref}
              className="text-[var(--accent)] underline underline-offset-2 light:text-[var(--accent-light)]"
            >
              {other.spoke.title}
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 py-10">
        {/* Who does what — and why */}
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Who does what — and why
        </h2>
        <div className="relative mt-4 pl-8">
          <span
            className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[color-mix(in_srgb,var(--accent)_60%,transparent)]"
            aria-hidden="true"
          />
          {s.whoWhatWhy.map((step, i) => (
            <div key={i} className="relative pb-5">
              <span
                className="absolute -left-8 top-0.5 h-3 w-3 rounded-full border-2 border-[var(--accent)] bg-background"
                aria-hidden="true"
              />
              <div className="font-semibold">
                <span className="text-[var(--accent)] light:text-[var(--accent-light)]">{step.you ? "You" : "TrustScope"}</span>
                {" — "}
                {step.role}
              </div>
              <p className="mt-1 text-sm text-muted">{step.text}</p>
            </div>
          ))}
        </div>

        {/* How TrustScope helps — pillars + verdict light */}
        <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-muted">
          How TrustScope helps
        </h2>
        <p className="mt-2 max-w-[52ch] text-sm text-muted">{s.helpsSub}</p>
        {/* Free product = three pillars; Functional Quality (Pillar 4) is Pro-only. The persona's
            own pillar list drives the count — meta (title/hue) is zipped in by index. */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {s.pillars.map((p, i) => {
            const meta = PILLARS_META[i];
            return (
              <div key={meta.id} className="rounded-xl border border-border bg-surface p-4">
                <span
                  className="rounded border px-1.5 py-0.5 font-mono text-[10.5px]"
                  style={{
                    color: meta.hueText,
                    borderColor: `color-mix(in srgb, ${meta.hue} 40%, transparent)`,
                    background: `color-mix(in srgb, ${meta.hue} 10%, transparent)`,
                  }}
                >
                  Pillar {meta.id}
                </span>
                <h3 className="mt-2.5 text-sm font-semibold">{meta.title}</h3>
                <div className="text-xs" style={{ color: meta.hueText }}>
                  {p.q}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{p.blurb}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-3.5 rounded-xl border border-dashed border-border bg-surface-2 p-4">
          <p className="text-[13.5px] font-semibold text-foreground">{s.nsaHeading}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 py-1.5 text-emerald-400 light:text-emerald-800">
              Adopt
            </span>
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 py-1.5 text-amber-400 light:text-amber-800">
              Proceed
            </span>
            <span className="rounded-full border border-rose-400/40 bg-rose-400/10 py-1.5 text-rose-400 light:text-rose-800">
              Avoid
            </span>
          </div>
          {s.verdictCaption && (
            <p className="mt-2 text-[11.5px] italic text-muted">{s.verdictCaption}</p>
          )}
        </div>

        {/* FAQ */}
        <h2 className="mt-10 text-xs font-semibold uppercase tracking-widest text-muted">
          Frequently asked
        </h2>
        <div className="mt-4">
          <FaqAccordion items={s.faqs} accent="var(--accent)" />
        </div>
      </section>
    </div>
  );
}
