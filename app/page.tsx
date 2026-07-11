import { BodoBadge } from "@/components/BodoBadge";
import { RecentRepos } from "@/components/RecentRepos";
import { RepoForm } from "@/components/RepoForm";
import { LANDING_BODO_BACKDROP } from "@/config/bodo";
import { PILLARS_META } from "@/config/pillars";

/** Adopter path — evaluating someone else's code. */
function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

/** Maintainer path — improving your own code. */
function WrenchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M15 6.5a3.6 3.6 0 0 0-4.8 4.8L4 17.5V20h2.5l6.2-6.2A3.6 3.6 0 0 0 17.5 9l-2.2 2.2-2.3-.6-.6-2.3L15 6.5z" />
    </svg>
  );
}

// Landing pillar copy (question + body). Title + hue come from PILLARS_META
// (config/pillars.ts) so the landing and the persona pages cannot drift.
const PILLARS = [
  {
    id: 1,
    q: "Is it built securely?",
    body: "The full OpenSSF Scorecard — token permissions, pinned dependencies, SAST, signed releases, and more.",
  },
  {
    id: 2,
    q: "Can I trust the project behind it?",
    body: "License, security policy, who owns it, and whether there is a way to reach them when something breaks.",
  },
  {
    id: 3,
    q: "Will it be here in a year?",
    body: "Maintenance, contributors, and recent activity — read as a lifecycle stage, never as a grade.",
  },
  // Pillar 4 (Functional Quality) is Pro-only — the free version assesses three pillars, so it is
  // not shown on the landing. It returns here when the Pro tier ships.
];

const STEPS = [
  { n: "1", t: "Paste a repo", d: "Any public GitHub repository — URL or owner/repo." },
  { n: "2", t: "Assess it with OpenSSF", d: "The full OpenSSF Scorecard, plus GitHub governance and lifecycle signals." },
  {
    n: "3",
    t: "Read your report by pillar",
    d: "Each pillar answers a different question, with its own findings and constructive fixes. No single grade papers over the trade-offs — you see where the project is strong and where it isn't.",
  },
  { n: "4", t: "Send fixes upstream", d: "File a friendly, attributed issue as yourself." },
];

export default function Home() {
  return (
    <div>
      {/* Hero — one picker, both roles; the try-box sits high, the hook right on top of it */}
      <section className="hero-glow">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-10 text-center sm:pt-14">
          <div className="mb-6 flex flex-col items-center gap-4">
            <BodoBadge backdrop={LANDING_BODO_BACKDROP} sizeClass="h-44 w-44" priority />
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Built on the OpenSSF Scorecard
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
            Don&apos;t build on code you haven&apos;t <span className="text-brand">vetted</span>.
          </h1>

          <div className="mx-auto mt-7 max-w-5xl rounded-2xl border border-border bg-surface p-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)] sm:p-5">
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-sm font-semibold">
              <span className="inline-flex items-center gap-1.5 text-brand">
                <SearchIcon /> Evaluating a tool
              </span>
              <span className="font-normal text-muted/50">/</span>
              <span className="inline-flex items-center gap-1.5 text-amber-400 light:text-amber-700">
                Maintaining one <WrenchIcon />
              </span>
            </div>

            <div className="mt-3.5">
              <RepoForm
                autoFocus
                submitClassName="cta-fade text-background transition-[filter] hover:brightness-105 sm:min-w-[11rem]"
                submitLabel="Run the report →"
                placeholder="owner/repo  ·  or your/repo"
              />
            </div>

            <div className="mt-3.5 flex flex-col items-center gap-1.5 text-center text-[13.5px] sm:flex-row sm:justify-center sm:gap-x-8">
              <span className="inline-flex items-center gap-2 text-brand">
                <SearchIcon />
                <span className="text-foreground">See its trust report before you commit.</span>
              </span>
              <span className="inline-flex items-center gap-2 text-amber-400 light:text-amber-700">
                <WrenchIcon />
                <span className="text-foreground">Find the gaps in your code — and fix them.</span>
              </span>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted/70">
            Try <span className="font-mono text-muted">ossf/scorecard</span> or{" "}
            <span className="font-mono text-muted">sindresorhus/got</span>. No sign-in needed to
            read a report.
          </p>
          <div className="mx-auto mt-2 max-w-5xl">
            <RecentRepos />
          </div>
        </div>
      </section>

      {/* Three pillars (Functional Quality is Pro-only) */}
      <section className="mx-auto max-w-5xl px-5 py-7">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted">
          Three questions, three pillars — one synthesis
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {PILLARS.map((p) => {
            const meta = PILLARS_META[p.id - 1];
            return (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-surface/60 p-5 transition-colors hover:border-brand/30"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: meta.hue }}
                  >
                    Pillar {p.id}
                  </span>
                  <span className="text-xs text-muted">· {p.q}</span>
                </div>
                <h3 className="mt-1.5 text-lg font-semibold tracking-tight">{meta.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/70 bg-surface/30">
        <div className="mx-auto max-w-5xl px-5 py-7">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted">
            How it works
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-3.5">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand/15 text-sm font-semibold text-brand ring-1 ring-brand/25">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight">{s.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why no single score */}
      <section className="mx-auto max-w-3xl px-5 py-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Why no single score?</h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          Each pillar answers a different question. A brilliant, secure library maintained by one
          person is not “7 out of 10” — it is strong on security and early on community. Collapsing
          that into one number hides exactly the trade-off you are trying to weigh. So we don&apos;t.
        </p>
      </section>
    </div>
  );
}
