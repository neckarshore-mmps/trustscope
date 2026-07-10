"use client";

import { useState } from "react";
import { pillarIssueUi, type IssueIconKind } from "@/lib/pillar-issue-ui";

/**
 * Per-pillar filing control (replaces the retired bulk IssueActions).
 * Uniform chrome; the icon + hint carry the OAuth-state difference (see lib/pillar-issue-ui.ts).
 *   - OAuth configured -> one-click POST /api/file-issue (files as the user), issue-dot icon.
 *   - OAuth absent      -> opens the pre-filled GitHub new-issue form, person icon.
 * Copy is always available (paste into your own tracker). All inputs are precomputed pure strings.
 */

function FileIcon({ kind }: { kind: IssueIconKind }) {
  if (kind === "person") {
    return (
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
        <circle cx="8" cy="5" r="2.6" />
        <path d="M3.4 13.6c0-2.5 2.1-4.1 4.6-4.1s4.6 1.6 4.6 4.1" />
      </svg>
    );
  }
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="8" cy="8" r="6.25" />
      <circle cx="8" cy="8" r="1.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <rect x="5" y="5" width="8.5" height="9.5" rx="1.6" />
      <path d="M3 11V3.6A1.6 1.6 0 0 1 4.6 2H10.5" />
    </svg>
  );
}

const FILE_CLS =
  "inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/[0.16] disabled:opacity-60";
const COPY_CLS =
  "inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-brand/40";

export function PillarIssueButton({
  owner,
  repo,
  title,
  body,
  prefilledUrl,
  oauthConfigured,
}: {
  owner: string;
  repo: string;
  title: string;
  body: string;
  prefilledUrl: string;
  oauthConfigured: boolean;
}) {
  const ui = pillarIssueUi(oauthConfigured);
  const [copied, setCopied] = useState(false);
  const [filing, setFiling] = useState(false);
  const [filedUrl, setFiledUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
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
        body: JSON.stringify({ owner, repo, title, body }),
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
    <div className="mt-3">
      <div className="flex flex-wrap gap-2.5">
        {ui.mode === "direct" ? (
          <button
            type="button"
            onClick={fileAsUser}
            disabled={filing}
            data-testid="pillar-file-issue"
            className={FILE_CLS}
          >
            <FileIcon kind={ui.iconKind} />
            {filing ? "Filing…" : ui.label}
          </button>
        ) : (
          <a
            href={prefilledUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="pillar-file-issue"
            className={FILE_CLS}
          >
            <FileIcon kind={ui.iconKind} />
            {ui.label}
          </a>
        )}

        <button type="button" onClick={copy} data-testid="pillar-copy-issue" className={COPY_CLS}>
          <CopyIcon />
          {copied ? "Copied ✓" : ui.copyLabel}
        </button>
      </div>

      {filedUrl && (
        <p className="mt-2 text-xs text-emerald-300">
          Issue filed —{" "}
          <a href={filedUrl} target="_blank" rel="noreferrer" className="underline">
            view it on GitHub ↗
          </a>
        </p>
      )}
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

      <details className="mt-2.5" data-testid="pillar-filing-hint">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs text-muted/85 marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="text-[10px]" aria-hidden>
            ▸
          </span>
          How does filing work?
        </summary>
        <div className="mt-2 space-y-1.5 border-l-2 border-brand/35 pl-3 text-xs leading-relaxed text-muted">
          {ui.hint.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </details>
    </div>
  );
}
