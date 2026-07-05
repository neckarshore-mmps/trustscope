import Image from "next/image";
import { RecentRepos } from "@/components/RecentRepos";
import { RepoForm } from "@/components/RepoForm";
import { PRODUCT_NAME } from "@/config/product";

const PILLARS = [
  {
    id: 1,
    title: "Functional Quality",
    q: "Is it well-built?",
    body: "Honestly marked “not assessed”. Whether software is good is a hands-on judgement — we never fake it from automated signals.",
    accent: "text-slate-400",
  },
  {
    id: 2,
    title: "Security & Supply Chain",
    q: "Is it built securely?",
    body: "The full OpenSSF Scorecard — token permissions, pinned dependencies, SAST, signed releases, and more.",
    accent: "text-emerald-300",
  },
  {
    id: 3,
    title: "Trust & Governance",
    q: "Can I trust the project behind it?",
    body: "License, security policy, who owns it, and whether there is a way to reach them when something breaks.",
    accent: "text-sky-300",
  },
  {
    id: 4,
    title: "Community & Sustainability",
    q: "Will it be here in a year?",
    body: "Maintenance, contributors, and recent activity — read as a lifecycle stage, never as a grade.",
    accent: "text-amber-300",
  },
];

const STEPS = [
  { n: "1", t: "Paste a repo", d: "Any public GitHub repository — URL or owner/repo." },
  { n: "2", t: "We assess it", d: "OpenSSF Scorecard plus GitHub governance and lifecycle signals." },
  { n: "3", t: "Read four pillars", d: "Per-pillar findings and constructive fixes — no single grade." },
  { n: "4", t: "Send fixes upstream", d: "File a friendly, attributed issue as yourself." },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-5 pb-8 pt-20 text-center sm:pt-28">
          <Image
            src="/bodo.svg"
            alt=""
            width={72}
            height={72}
            className="mx-auto mb-6"
            priority
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Built on the OpenSSF Scorecard
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Know how much you can trust an{" "}
            <span className="text-brand">open-source project</span> — before you adopt it.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Paste a public GitHub repo. {PRODUCT_NAME} returns a four-pillar trust report with
            constructive, upstream-friendly fixes — and no misleading single score.
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <RepoForm autoFocus />
            <p className="mt-3 text-xs text-muted/70">
              Try{" "}
              <span className="font-mono text-muted">ossf/scorecard</span> or{" "}
              <span className="font-mono text-muted">sindresorhus/got</span>. No sign-in needed to
              read a report.
            </p>
            <RecentRepos />
          </div>
        </div>
      </section>

      {/* Four pillars */}
      <section className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted">
          Four questions, four pillars — one synthesis
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-surface/60 p-5 transition-colors hover:border-brand/30"
            >
              <div className="flex items-baseline gap-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${p.accent}`}>
                  Pillar {p.id}
                </span>
                <span className="text-xs text-muted">· {p.q}</span>
              </div>
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>
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

      {/* Why no single score */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
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
