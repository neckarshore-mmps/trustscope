"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import { SEED_REPOS } from "@/config/seed-repos";
import { parseRepoInput } from "@/lib/parse-repo-input";
import { buildSuggestions, filterSuggestions } from "@/lib/repo-suggestions";
import { useRecentRepos } from "@/lib/use-recent-repos";

/** Accessible searchable repo combobox (seeds ∪ recent). Free entry is always preserved. */
export function RepoForm({
  autoFocus = false,
  submitClassName = "bg-brand text-background transition-opacity hover:opacity-90",
  submitLabel = "Assess this repo →",
  placeholder = "ossf/scorecard  ·  https://github.com/owner/repo",
}: {
  autoFocus?: boolean;
  /** Extra classes for the submit button — lets the landing swap in the dual-role fade fill. */
  submitClassName?: string;
  submitLabel?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // When the field auto-focuses (the landing), open the list by default so the
  // default suggestions are server-rendered and visible immediately — the native
  // autofocus fires before hydration, so relying on onFocus alone leaves the list
  // shut until a second interaction.
  const [open, setOpen] = useState(autoFocus);
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
  /** Choosing a suggestion fills the input — it does NOT start the report. The
   *  user assesses only via an explicit submit (the Assess button or Enter). */
  function select(s: { owner: string; repo: string }) {
    setValue(`${s.owner}/${s.repo}`);
    setOpen(false);
    setActive(-1);
    setError(null);
    inputRef.current?.focus();
  }
  /** Explicit submission (the Assess button, or Enter with no highlighted option):
   *  always assesses the input value. Highlighted-option selection is handled in
   *  onKeyDown, so clicking Assess navigates even while a suggestion is highlighted. */
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    } else if (e.key === "Enter" && open && active >= 0 && active < suggestions.length) {
      // Enter on a highlighted option selects it (fills the input) and preventDefault
      // stops the implicit form submit; a second Enter (nothing highlighted) assesses.
      e.preventDefault();
      select(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }
  function clearInput() {
    setValue("");
    setOpen(false);
    setActive(-1);
    setError(null);
    // The clear button preventDefaults mousedown, so focus never left the input — this is a
    // belt-and-suspenders refocus. Because focus stays put, no onFocus fires to reopen the list.
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative w-full">
          <label htmlFor="repo" className="sr-only">
            Public GitHub repository
          </label>
          <div className="relative">
            <input
              id="repo"
              name="repo"
              type="text"
              role="combobox"
              ref={inputRef}
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
              placeholder={placeholder}
              className={`w-full rounded-lg border border-border bg-surface py-3 pl-4 text-[15px] text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/20 ${value ? "pr-11" : "pr-4"}`}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "repo-error" : undefined}
            />
            {value && (
              <button
                type="button"
                aria-label="Clear input"
                title="Clear"
                // Keep focus on the input so onFocus never fires to reopen the closed list.
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearInput}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <span aria-hidden className="text-lg leading-none">
                  ×
                </span>
              </button>
            )}
          </div>
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
                    select(s);
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
          className={`shrink-0 rounded-lg px-6 py-3 text-[15px] font-semibold disabled:opacity-60 ${submitClassName}`}
        >
          {busy ? "Assessing…" : submitLabel}
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
