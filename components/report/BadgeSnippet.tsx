"use client";

import { useState } from "react";
import { PRODUCT_NAME, PRODUCT_SUBDOMAIN } from "@/config/product";

/**
 * B4: the "copy this to your README" snippet for the trust badge. The badge image is
 * label-only + repo-agnostic (`/badge`); the per-repo meaning lives in the link that wraps
 * it. Snippet URLs are the PROD absolute base (not window.origin) so a pasted README works
 * from anywhere.
 */
export function BadgeSnippet({ owner, repo }: { owner: string; repo: string }) {
  const [copied, setCopied] = useState(false);
  const base = `https://${PRODUCT_SUBDOMAIN}`;
  const slug = `${owner}/${repo}`;
  const reportUrl = `${base}/report?repo=${encodeURIComponent(slug)}`;
  const markdown = `[![${PRODUCT_NAME} trust report](${base}/badge)](${reportUrl})`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the user can still select the snippet text manually.
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface/60 p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight">Add the badge to your README</h2>
      <p className="mt-1 text-sm text-muted">
        A branded link back to this report — no score on the badge, by design.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- an external SVG badge, not a Next asset */}
        <img src="/badge" alt={`${PRODUCT_NAME} trust report`} width={140} height={20} />
        <button
          type="button"
          onClick={copy}
          aria-live="polite"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium transition-colors hover:border-brand/40"
        >
          {copied ? "Copied ✓" : "Copy Markdown"}
        </button>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">
        <code>{markdown}</code>
      </pre>
    </section>
  );
}
