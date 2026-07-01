"use client";

import { useState } from "react";
import type { ReportModel } from "@/lib/report-core/types";
import {
  buildIssueMarkdown,
  buildIssueTitle,
  prefilledIssueUrl,
} from "@/lib/issue-markdown";

/**
 * The reputation mechanism, made actionable (work-order §2 / Phase 4).
 * Two credential-free paths always work:
 *   1. Copy Markdown — paste anywhere.
 *   2. Open a pre-filled GitHub issue — the user submits it as themselves (consent built in).
 * When a GitHub OAuth App is configured (§7 User-Action #3), a one-click "file as yourself"
 * button is additionally offered (env-gated via `oauthConfigured`).
 */
export function IssueActions({
  report,
  totalFixes,
  oauthConfigured = false,
}: {
  report: ReportModel;
  totalFixes: number;
  oauthConfigured?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [filing, setFiling] = useState(false);
  const [filedUrl, setFiledUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const markdown = buildIssueMarkdown(report);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access was blocked — select the text manually.");
    }
  }

  async function fileAsUser() {
    setFiling(true);
    setError(null);
    try {
      const res = await fetch("/api/file-issue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner: report.repo.owner,
          repo: report.repo.name,
          title: buildIssueTitle(report),
          body: markdown,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string; signInUrl?: string };
      if (res.status === 401 && data.signInUrl) {
        window.location.href = data.signInUrl;
        return;
      }
      if (!res.ok || !data.url) throw new Error(data.error ?? `HTTP ${res.status}`);
      setFiledUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not file the issue.");
    } finally {
      setFiling(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface/60 p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight">Send the suggestions upstream</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
        {totalFixes} constructive suggestion{totalFixes === 1 ? "" : "s"} across the pillars. File
        them as a friendly issue on the project — every issue carries a “via {report.product}”
        footer, so real improvements to real projects trace back here.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium transition-colors hover:border-brand/40"
        >
          {copied ? "Copied ✓" : "Copy Markdown"}
        </button>

        <a
          href={prefilledIssueUrl(report)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium transition-colors hover:border-brand/40"
        >
          Open a pre-filled issue on GitHub ↗
        </a>

        {oauthConfigured && (
          <button
            type="button"
            onClick={fileAsUser}
            disabled={filing}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {filing ? "Filing…" : "File as yourself (one click)"}
          </button>
        )}
      </div>

      {filedUrl && (
        <p className="mt-3 text-sm text-emerald-300">
          Issue filed —{" "}
          <a href={filedUrl} target="_blank" rel="noreferrer" className="underline">
            view it on GitHub ↗
          </a>
        </p>
      )}
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

      {!oauthConfigured && (
        <p className="mt-3 text-xs text-muted/70">
          One-click filing as yourself activates once a GitHub OAuth App is connected. Until then,
          the pre-filled issue opens the form for you to submit — it is your own action, never a bot.
        </p>
      )}
    </section>
  );
}
