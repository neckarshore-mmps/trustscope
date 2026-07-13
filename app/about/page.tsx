import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCT_NAME, PRODUCT_ORG, PRODUCT_SUBDOMAIN } from "@/config/product";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "About",
  description: `${PRODUCT_NAME} is an open-source trust report by ${PRODUCT_ORG} — made in Germany, GDPR-clean, open source. Who is behind it and why.`,
};

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: PRODUCT_ORG,
  url: "https://neckarshore.ai",
  founder: {
    "@type": "Person",
    name: "German Rauhut",
  },
  subOrganization: {
    "@type": "SoftwareApplication",
    name: PRODUCT_NAME,
    url: `https://${PRODUCT_SUBDOMAIN}`,
  },
} as const;

export default function AboutPage() {
  return (
    <div>
      <JsonLd data={ORG_SCHEMA} />
      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-5 pb-6 pt-20 text-center sm:pt-28">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Built by <span className="text-brand">{PRODUCT_ORG}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            {PRODUCT_NAME} is an open-source trust report — made in Germany,
            GDPR-clean, and open source.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-4 px-5 py-12 text-[15px] leading-relaxed text-muted">
        <p>
          <span className="font-medium text-foreground/90">Who&apos;s behind it.</span>{" "}
          {PRODUCT_NAME} is built by {PRODUCT_ORG}, the software studio of{" "}
          <span className="font-medium text-foreground/90">German Rauhut</span> in
          Stuttgart, Germany. It runs on its own standards — we assess our own
          repositories with the same report we hand to everyone else.
        </p>
        <p>
          <span className="font-medium text-foreground/90">Why {PRODUCT_NAME}.</span>{" "}
          Deciding whether to adopt a third-party open-source dependency usually means
          guessing — a star count, a gut feeling, or a single number that hides the
          trade-off you actually care about. {PRODUCT_NAME} grew out of a Product Trust
          &amp; Quality Framework: turn the public signals a project already emits into a
          calm, three-pillar read on how much you can trust it — and never fake the
          fourth (Functional Quality), the one only a human can judge.
        </p>
        <p>
          <span className="font-medium text-foreground/90">Made in Germany.</span> Self-hosted
          fonts, no third-party trackers, and a privacy posture that matches EU expectations by
          default.
        </p>
        <p>
          <span className="font-medium text-foreground/90">Open.</span> {PRODUCT_NAME} builds on
          the public OpenSSF Scorecard and is deterministic — the same repository always produces
          the same report.
        </p>
        <div className="pt-4">
          <a
            className="text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand"
            href="https://neckarshore.ai"
            target="_blank"
            rel="noreferrer"
          >
            neckarshore.ai →
          </a>
        </div>
        {/* Migration contract (spec §3): /about was repurposed; send mechanics-seekers to /how-it-works. */}
        <p className="pt-2 text-sm">
          <Link
            href="/how-it-works"
            className="text-foreground/70 underline decoration-border underline-offset-4 hover:text-brand"
          >
            Looking for how TrustScope works? →
          </Link>
        </p>
        <div className="pt-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Try it on a repo →
          </Link>
        </div>
      </section>
    </div>
  );
}
