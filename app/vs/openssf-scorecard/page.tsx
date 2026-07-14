import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCT_NAME } from "@/config/product";
import { JsonLd } from "@/components/JsonLd";
import { TryItCta } from "@/components/TryItCta";
import { breadcrumb } from "@/lib/schema";

export const metadata: Metadata = {
  title: "TrustScope vs the OpenSSF Scorecard",
  description:
    "TrustScope is built on the OpenSSF Scorecard — and adds two more pillars, governance and community, without collapsing everything into one score. An honest side-by-side of when to use which.",
  alternates: { canonical: "/vs/openssf-scorecard" },
};

const BREADCRUMB = breadcrumb([
  { name: "TrustScope vs OpenSSF Scorecard", path: "/vs/openssf-scorecard" },
]);

type Row = { dim: string; scorecard: string; trustscope: string };

const ROWS: Row[] = [
  {
    dim: "What it measures",
    scorecard:
      "Security & supply-chain heuristics: branch protection, pinned dependencies, token permissions, SAST, signed releases, and more.",
    trustscope:
      "The full Scorecard as one pillar, plus two more — Trust & Governance and Community & Sustainability.",
  },
  {
    dim: "Headline output",
    scorecard: "A single aggregate score, 0–10.",
    trustscope: "A verdict per pillar. No single number that hides the trade-off.",
  },
  {
    dim: "How you run it",
    scorecard: "CLI, GitHub Action, or API — you wire it into your pipeline.",
    trustscope: "Paste a public repo in the browser. Nothing to install.",
  },
  {
    dim: "Account",
    scorecard: "None needed.",
    trustscope: "None needed — reading a report is anonymous, no sign-in.",
  },
  {
    dim: "What you do with findings",
    scorecard: "Read the check docs and act on your own.",
    trustscope:
      "Each finding comes with a constructive, upstream-friendly fix you can file as yourself.",
  },
  {
    dim: "Determinism",
    scorecard: "Deterministic — same repo, same checks.",
    trustscope: "Deterministic, no LLM in the loop — same repo, same report.",
  },
  {
    dim: "Cost & licence",
    scorecard: "Free and open source (OpenSSF / Linux Foundation).",
    trustscope: "Free to read, open source (MIT), and self-assessing.",
  },
];

function Cell({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <td
      className={`border-t border-border px-4 py-3 align-top text-sm ${
        strong ? "text-foreground" : "text-muted"
      }`}
    >
      {children}
    </td>
  );
}

export default function VsOpenSsfScorecardPage() {
  return (
    <div>
      <JsonLd data={BREADCRUMB} />

      {/* Hero */}
      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-5 pb-6 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Comparison
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {PRODUCT_NAME} vs the{" "}
            <span className="text-brand">OpenSSF Scorecard</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Not really a rivalry: {PRODUCT_NAME}{" "}runs the full OpenSSF Scorecard for
            you — and adds the two questions a raw score can&apos;t answer.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-5 py-6">
        <p className="text-[15px] leading-relaxed text-muted">
          The OpenSSF Scorecard is the reference standard for open-source security hygiene,
          and {PRODUCT_NAME} is built directly on it. The Scorecard collapses its checks into
          one 0–10 number — useful for a CI gate, but a single number hides the trade-off you
          are trying to weigh. {PRODUCT_NAME}{" "}keeps the Scorecard as one of three pillars,
          adds governance and community, and reports a verdict per pillar so you see where a
          project is strong and where it isn&apos;t.
        </p>
      </section>

      {/* Table */}
      <section className="mx-auto max-w-3xl px-5 py-4">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr>
                <th className="bg-surface-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  Dimension
                </th>
                <th className="bg-surface-2 px-4 py-3 text-sm font-semibold">
                  OpenSSF Scorecard (alone)
                </th>
                <th className="bg-surface-2 px-4 py-3 text-sm font-semibold text-brand">
                  {PRODUCT_NAME}
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.dim}>
                  <th className="border-t border-border bg-surface/40 px-4 py-3 text-left align-top text-sm font-medium text-foreground">
                    {r.dim}
                  </th>
                  <Cell>{r.scorecard}</Cell>
                  <Cell strong>{r.trustscope}</Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* When to use which */}
      <section className="mx-auto max-w-3xl px-5 py-8">
        <h2 className="text-2xl font-semibold tracking-tight">When to use which</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface/60 p-5">
            <h3 className="font-semibold tracking-tight">Reach for the Scorecard directly</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              When you want the raw security signal scripted into CI — a threshold that fails
              a build, tracked over time in your own pipeline.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface/60 p-5">
            <h3 className="font-semibold tracking-tight">Reach for {PRODUCT_NAME}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              When a human is vetting a dependency and needs governance and community context
              next to security — with the trade-offs kept visible, not averaged away, and a
              constructive fix for each gap.
            </p>
          </div>
        </div>
        <p className="mt-6 text-[15px] leading-relaxed text-muted">
          They aren&apos;t either/or. {PRODUCT_NAME}{" "}runs the full Scorecard for you, so
          using it never means giving up the Scorecard — only adding the context around it.{" "}
          <Link
            href="/how-it-works"
            className="text-brand underline underline-offset-2"
          >
            See how it works →
          </Link>
        </p>
      </section>

      <TryItCta heading={`Run ${PRODUCT_NAME} on a repo`} />
    </div>
  );
}
