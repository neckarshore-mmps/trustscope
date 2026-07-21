import Link from "next/link";
import { PRODUCT_NAME, PRODUCT_ORG } from "@/config/product";
import { APP_VERSION, GIT_SHA, COMMIT_URL } from "@/config/version";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-5 py-8 text-center text-sm text-muted">
        <div className="max-w-2xl space-y-1">
          <p>
            {PRODUCT_NAME} builds on the{" "}
            <a
              className="text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand"
              href="https://securityscorecards.dev"
              target="_blank"
              rel="noreferrer"
            >
              OpenSSF Scorecard
            </a>
            . No single aggregate score — by design.
          </p>
          <p>
            A {PRODUCT_ORG} product · Made in Germany ·{" "}
            <a
              className="text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand"
              href="https://neckarshore.ai"
              target="_blank"
              rel="noreferrer"
            >
              neckarshore.ai
            </a>
          </p>
        </div>

        {/* B3 (GTM cross-link): the estate's three public tools — Read · Maintain · Trust.
            Every visitor to any tool discovers the other two. md-viewer = live web twin;
            OVA = the neckarshore.ai product page; TrustScope self-links home. */}
        <div className="w-full max-w-2xl border-t border-border/40 pt-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted/70 light:text-muted">
            More Neckarshore tooling
          </p>
          <nav
            aria-label="More Neckarshore tooling"
            className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm"
          >
            <a
              className="group inline-flex items-baseline gap-1.5 transition-colors hover:text-foreground"
              href="https://md.neckarshore.ai"
              target="_blank"
              rel="noreferrer"
            >
              <span className="text-xs uppercase tracking-wide text-muted/60 light:text-muted group-hover:text-brand">
                Read
              </span>
              md-viewer
            </a>
            <a
              className="group inline-flex items-baseline gap-1.5 transition-colors hover:text-foreground"
              href="https://neckarshore.ai/products/obsidian-vault-autopilot"
              target="_blank"
              rel="noreferrer"
            >
              <span className="text-xs uppercase tracking-wide text-muted/60 light:text-muted group-hover:text-brand">
                Maintain
              </span>
              Vault Autopilot
            </a>
            <Link
              className="group inline-flex items-baseline gap-1.5 transition-colors hover:text-foreground"
              href="/"
            >
              <span className="text-xs uppercase tracking-wide text-muted/60 light:text-muted group-hover:text-brand">
                Trust
              </span>
              {PRODUCT_NAME}
            </Link>
          </nav>
        </div>

        <nav
          aria-label="Legal and feedback"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        >
          <Link href="/impressum" className="transition-colors hover:text-foreground">
            Impressum
          </Link>
          <Link href="/datenschutz" className="transition-colors hover:text-foreground">
            Datenschutz
          </Link>
          <Link
            href="/impressum"
            className="rounded-lg border border-border bg-surface/60 px-3 py-1 text-xs font-medium transition-colors hover:border-brand/40 hover:text-foreground"
          >
            Feedback
          </Link>
        </nav>

        {/* Version status line — uniform AD-42 variant A: product · version · commit-linked SHA · Changelog.
            Content is uniform across the estate; TrustScope's position/styling stays its own. */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted/70 light:text-muted">
          <span className="font-mono">
            {PRODUCT_NAME} v{APP_VERSION}
          </span>
          {GIT_SHA && (
            <>
              <span aria-hidden="true">·</span>
              {COMMIT_URL ? (
                <a
                  href={COMMIT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-muted/80 light:text-muted transition-colors hover:text-foreground"
                >
                  {GIT_SHA}
                </a>
              ) : (
                <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-muted/80 light:text-muted">
                  {GIT_SHA}
                </code>
              )}
            </>
          )}
          <span aria-hidden="true">·</span>
          <Link
            href="/changelog"
            className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            Changelog
          </Link>
          {/* Internal design-system reference — discreet on purpose. noindex, not in
              the sitemap; this footer link is the only way in. */}
          <span aria-hidden="true">·</span>
          <Link
            href="/style-guide"
            className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            Style Guide
          </Link>
        </div>
      </div>
    </footer>
  );
}
