import Link from "next/link";
import type { Metadata } from "next";
import { PRODUCT_NAME, PRODUCT_ORG } from "@/config/product";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "TrustScope turns a public GitHub repo into a deterministic three-pillar trust report — security & supply chain, governance, and community — with constructive, upstream-friendly fixes and no misleading single score.",
};

const PILLARS = [
  {
    id: 1,
    title: "Security & Supply Chain",
    q: "Is it built securely?",
    body: "The full OpenSSF Scorecard: branch protection, pinned dependencies, token permissions, SAST, signed releases, dependency-update tooling, and more — the checks that decide how safe it is to pull into your build.",
    accent: "text-emerald-300",
  },
  {
    id: 2,
    title: "Trust & Governance",
    q: "Can I trust the project behind it?",
    body: "License, security policy, and the responsible owner — is there a way to reach someone when something breaks, and are the rules of engagement clear? The project behind the code matters as much as the code.",
    accent: "text-sky-300",
  },
  {
    id: 3,
    title: "Community & Sustainability",
    q: "Will it be here in a year?",
    body: "Maintenance cadence, contributors, and recent activity — read as a lifecycle stage, never as a grade. A one-maintainer library early in its life is not “failing”; it is simply young.",
    accent: "text-amber-300",
  },
  // Pillar 4 (Functional Quality) is Pro-only — the free version assesses three pillars, so it is
  // not listed here. It returns as its own pillar when the Pro tier ships.
];

const STEPS = [
  {
    n: "1",
    t: "Paste a public repository",
    d: "Any public GitHub repo — a full URL or just owner/repo.",
  },
  {
    n: "2",
    t: "We assess it deterministically",
    d: "TrustScope runs the OpenSSF Scorecard and reads public GitHub governance and lifecycle signals. Same repo, same report — reproducible.",
  },
  {
    n: "3",
    t: "Read the three pillars",
    d: "Per-pillar findings, each answering its own question — with the trade-offs kept visible instead of averaged away.",
  },
  {
    n: "4",
    t: "Send fixes upstream, as yourself",
    d: "Every finding comes with a constructive suggestion. File them as a friendly GitHub issue in one click — as yourself, with a visible “via TrustScope” footer. Never a bot.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-5 pb-8 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            How {PRODUCT_NAME} works
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            A deterministic trust report for{" "}
            <span className="text-brand">open-source projects</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            {PRODUCT_NAME}{" "}checks a public GitHub repository and reflects it back across three
            pillars — security &amp; supply chain, governance, and community — without hiding the
            trade-offs behind a single score.
          </p>
        </div>
      </section>

      {/* The problem */}
      <section className="mx-auto max-w-3xl px-5 py-14">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          The problem
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90">
          Adopting an open-source tool means running someone else&apos;s code in your own supply
          chain — and deciding how far to trust it. A star count or a green badge says little about
          that. The questions that actually matter — Is it built securely? Is there a reliable
          project behind it? Will it still be maintained in a year? — stay unanswered, or vanish
          behind one number.
        </p>
      </section>

      {/* The three pillars */}
      <section className="border-t border-border/70 bg-surface/30">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted">
            The three pillars
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[15px] leading-relaxed text-muted">
            {PRODUCT_NAME}{" "}answers each question separately, because each one is different.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PILLARS.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-surface/60 p-5 transition-colors hover:border-brand/30"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${p.accent}`}
                  >
                    Pillar {p.id}
                  </span>
                  <span className="text-xs text-muted">· {p.q}</span>
                </div>
                <h3 className="mt-1.5 text-lg font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why no single score */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Why no single score?</h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Because each pillar answers a different question. A brilliant, secure library maintained
          by one person is not “7 out of 10” — it is strong on security and early on community.
          Collapsing that into one number hides exactly the trade-off you are trying to weigh. So{" "}
          {PRODUCT_NAME}{" "}doesn&apos;t.
        </p>
      </section>

      {/* How it works */}
      <section className="border-t border-border/70 bg-surface/30">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted">
            How it works
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-sm font-semibold text-brand ring-1 ring-brand/25">
                  {s.n}
                </div>
                <h3 className="mt-3 font-semibold tracking-tight">{s.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open, deterministic, made in Germany */}
      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          Open, deterministic, upstream-friendly
        </h2>
        <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted">
          <p>
            <span className="font-medium text-foreground/90">Deterministic.</span> The same
            repository produces the same report — the assessment is grounded in the OpenSSF
            Scorecard and public GitHub data, not in opinion.
          </p>
          <p>
            <span className="font-medium text-foreground/90">Constructive by default.</span> Every
            finding is paired with a concrete fix and framed as a suggestion, not a verdict. When
            you file it upstream, the issue is opened as you — with a visible “via {PRODUCT_NAME}”
            attribution — so real improvements trace back to a real person.
          </p>
          <p>
            <span className="font-medium text-foreground/90">Open source.</span> {PRODUCT_NAME} is
            MIT-licensed and public on{" "}
            <a
              className="text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand"
              href="https://github.com/neckarshore-mmps/trustscope"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            . An open-source trust report by {PRODUCT_ORG} — and it runs on itself.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Try it on a repo →
          </Link>
          <a
            href="https://securityscorecards.dev"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium transition-colors hover:border-brand/40"
          >
            About the OpenSSF Scorecard ↗
          </a>
        </div>
      </section>
    </div>
  );
}
