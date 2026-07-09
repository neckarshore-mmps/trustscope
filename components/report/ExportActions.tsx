"use client";

import { useState } from "react";
import type { ReportModel } from "@/lib/report-core/types";
import { exportFilename, reportToHtml, reportToMarkdown } from "@/lib/report-export";

function triggerDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportActions({ report }: { report: ReportModel }) {
  const [copied, setCopied] = useState(false);

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(reportToMarkdown(report));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable or permission denied — the download buttons remain the fallback.
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface/60 p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight">Export this report</h2>
      <p className="mt-1 text-sm text-muted">
        A self-contained copy — deterministic, the same repo always produces the same file.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copyMarkdown}
          aria-live="polite"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium transition-colors hover:border-brand/40"
        >
          {copied ? "Copied ✓" : "Copy Markdown"}
        </button>
        <button
          type="button"
          onClick={() =>
            triggerDownload(exportFilename(report, "md"), reportToMarkdown(report), "text/markdown")
          }
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium transition-colors hover:border-brand/40"
        >
          Download Markdown
        </button>
        <button
          type="button"
          onClick={() =>
            triggerDownload(exportFilename(report, "html"), reportToHtml(report), "text/html")
          }
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium transition-colors hover:border-brand/40"
        >
          Download HTML
        </button>
      </div>
    </section>
  );
}
