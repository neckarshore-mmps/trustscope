import Link from "next/link";
import { PRODUCT_NAME, PRODUCT_ORG } from "@/config/product";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
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
        <nav aria-label="Legal" className="flex shrink-0 items-center gap-4">
          <Link href="/impressum" className="transition-colors hover:text-foreground">
            Impressum
          </Link>
          <Link
            href="/datenschutz"
            className="transition-colors hover:text-foreground"
          >
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
