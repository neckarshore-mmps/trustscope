"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseRepoInput } from "@/lib/parse-repo-input";

/** Repo-URL input. Validates client-side, then navigates to /report?repo=owner/repo. */
export function RepoForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseRepoInput(value);
    if (!parsed) {
      setError("Enter a GitHub repo — e.g. ossf/scorecard, or a full github.com URL.");
      return;
    }
    setError(null);
    setBusy(true);
    router.push(`/report?repo=${encodeURIComponent(`${parsed.owner}/${parsed.repo}`)}`);
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="repo" className="sr-only">
          Public GitHub repository
        </label>
        <input
          id="repo"
          name="repo"
          type="text"
          inputMode="url"
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ossf/scorecard  ·  https://github.com/owner/repo"
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-[15px] text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "repo-error" : undefined}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg bg-brand px-6 py-3 text-[15px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Assessing…" : "Assess"}
        </button>
      </div>
      {error && (
        <p id="repo-error" className="mt-2 text-sm text-rose-300">
          {error}
        </p>
      )}
    </form>
  );
}
