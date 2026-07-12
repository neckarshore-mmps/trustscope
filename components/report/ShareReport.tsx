"use client";

import { useState } from "react";
import { PRODUCT_NAME } from "@/config/product";

/**
 * B2 (launch virality): a visible share affordance on the report page. The report URL
 * already persists + is shareable, but nothing invited sharing — so shared links (and the
 * B1 per-report card) never spread. Copy-permalink is the primary control; X + LinkedIn
 * intents and the native share sheet (mobile) ride alongside. Client-only: it reads
 * `window.location.origin` so the permalink is correct on prod, preview, and localhost.
 */
export function ShareReport({ owner, repo }: { owner: string; repo: string }) {
  const [copied, setCopied] = useState(false);
  const slug = `${owner}/${repo}`;

  function permalink(): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/report?repo=${encodeURIComponent(slug)}`;
  }

  const shareText = `Trust report for ${slug} — ${PRODUCT_NAME}, three pillars of trust, no single fake score.`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(permalink());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (private mode / permission) — the X + LinkedIn links still work.
    }
  }

  async function nativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      void copy();
      return;
    }
    try {
      await navigator.share({ title: `${slug} · ${PRODUCT_NAME}`, text: shareText, url: permalink() });
    } catch {
      // User dismissed the share sheet — no-op.
    }
  }

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(permalink())}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(permalink())}`;
  const linkClass =
    "inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-sm font-medium transition-colors hover:border-brand/40";

  return (
    <section
      aria-label="Share this report"
      className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/50 pt-5"
    >
      <span className="text-sm font-medium text-muted">Share this report</span>
      <button type="button" onClick={copy} aria-live="polite" className={linkClass}>
        {copied ? "Link copied ✓" : "Copy link"}
      </button>
      <a className={linkClass} href={xUrl} target="_blank" rel="noreferrer">
        Share on X
      </a>
      <a className={linkClass} href={liUrl} target="_blank" rel="noreferrer">
        Share on LinkedIn
      </a>
      <button
        type="button"
        onClick={nativeShare}
        className={`${linkClass} sm:hidden`}
        aria-label="Open the system share sheet"
      >
        Share…
      </button>
    </section>
  );
}
