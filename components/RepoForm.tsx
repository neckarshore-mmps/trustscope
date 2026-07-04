"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { SEED_REPOS } from "@/config/seed-repos";
import { parseRepoInput } from "@/lib/parse-repo-input";
import { buildSuggestions, filterSuggestions } from "@/lib/repo-suggestions";
import { useRecentRepos } from "@/lib/use-recent-repos";

/** Accessible searchable repo combobox (seeds ∪ recent). Free entry is always preserved. */
export function RepoForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const listboxId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const recent = useRecentRepos();
  const suggestions = useMemo(
    () => filterSuggestions(buildSuggestions(SEED_REPOS, recent), value),
    [recent, value],
  );
  const optionId = (i: number) => `${listboxId}-opt-${i}`;

  function go(owner: string, repo: string) {
    setBusy(true);
    router.push(`/report?repo=${encodeURIComponent(`${owner}/${repo}`)}`);
  }
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (open && active >= 0 && active < suggestions.length) {
      const s = suggestions[active];
      go(s.owner, s.repo);
      return;
    }
    const parsed = parseRepoInput(value);
    if (!parsed) {
      setError("Enter a GitHub repo — e.g. ossf/scorecard, or a full github.com URL.");
      return;
    }
    setError(null);
    go(parsed.owner, parsed.repo);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative w-full">
          <label htmlFor="repo" className="sr-only">
            Public GitHub repository
          </label>
          <input
            id="repo"
            name="repo"
            type="text"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
            inputMode="url"
            autoFocus={autoFocus}
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
              setActive(-1);
              setError(null);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            placeholder="ossf/scorecard  ·  https://github.com/owner/repo"
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-[15px] text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "repo-error" : undefined}
          />
          {open && suggestions.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg"
            >
              {suggestions.map((s, i) => (
                <li
                  key={`${s.owner}/${s.repo}`}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(s.owner, s.repo);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-[15px] ${i === active ? "bg-brand/10" : ""}`}
                >
                  <span className="font-mono text-foreground">
                    {s.owner}/{s.repo}
                  </span>
                  <span className="text-xs text-muted">
                    {s.kind === "pinned"
                      ? "TrustScope"
                      : s.kind === "recent"
                        ? "recent"
                        : "example"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
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
