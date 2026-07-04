# Repo selection (combobox) + Recently-Viewed — design spec

Two client-local surfaces backed by **one** localStorage module. The plain repo input becomes an
accessible, incrementally-searchable **combobox** (seeds + your recently-viewed, free entry always
preserved); a **Recently-Viewed strip** on the landing page surfaces your history and links straight
to each report.

**Design approved by the Founder 2026-07-04.** Per the revised orchestration, **Linus writes the
implementation plan; MASCHIN reviews the plan** (not the brainstorm); Linus builds; the Founder
visual-accepts both surfaces. This is the durable **no-login** experience — it coexists with the
future login-history (D7), it is not thrown away when accounts arrive.

## Product decisions (locked in the brainstorm)

| # | Decision | Value |
|---|----------|-------|
| 1 | Storage | **client-local (`localStorage`)** — no server, no auth, no new GDPR surface |
| 2 | Surfaces | **two, one data source**: the combobox + the Recently-Viewed strip |
| 3 | Combobox role | the **action input** — assess any repo; the list **augments, never restricts** (free entry always works) |
| 4 | Strip role | a **history / return** surface — **pure history: empty until the first view** (no seeded default) |
| 5 | Seeds (combobox only) | `neckarshore-mmps/trustscope` **pinned** + a curated few famous repos (`ossf/scorecard`, `sindresorhus/got` to start) |
| 6 | Ordering | combobox: **trustscope pin → recently-viewed (recency) → remaining seeds A→Z**; strip: recency |
| 7 | Stored per entry | **minimal (Variant A)**: `owner/repo` + `viewedAt`. No cached report preview (avoids R3 duplication/staleness) |
| 8 | Cap + dedup | ~8 recent entries; dedup by `owner/repo` (move-to-front on re-view) |
| 9 | Privacy | a one-line note — *"Saved only in your browser."* Reinforces the no-tracking posture |

## Architecture

- **`lib/recent-repos.ts`** — read / add / clear a capped, deduped, most-recent-first list, over an
  **injected storage interface** (so unit tests never touch a real `localStorage`).
- **`config/seed-repos.ts`** — static `SEED_REPOS` (trustscope pinned + the famous few).
- **`components/RepoForm.tsx` → accessible combobox** — merges `seeds ∪ recent` (deduped), filters on
  input, keyboard-navigable, ARIA-correct, and still submits arbitrary free text via `parseRepoInput`.
- **`components/RecentRepos.tsx`** — the landing strip; reads the list on mount (hydration-safe:
  renders nothing server-side, populates in `useEffect`); links to `/report?repo=owner/repo`; a Clear
  control; renders nothing when empty.
- **`components/RecordView.tsx`** — a tiny client component on the `/report` success path; adds the
  viewed repo to `recent-repos` on mount.
- **Wiring** — `app/page.tsx` renders the strip under the hero; `app/report/page.tsx` renders
  `RecordView` on the success branch (it already has the parsed `owner`/`repo`).

## The two surfaces (behaviour)

- **Combobox** — incremental substring filter on `owner/repo`; ordering per decision #6; Enter/click on
  an option navigates; free text → `parseRepoInput` → navigate (the existing core, unchanged).
  **A11y:** `role="combobox"` + `role="listbox"`/`role="option"`, `aria-expanded`,
  `aria-controls`, `aria-activedescendant`; Arrow/Enter/Escape + focus management. No combobox library
  (React only, per the repo rule) — hand-rolled and accessible.
- **Strip** — below the hero; each entry shows `owner/repo` + a relative time ("2h ago"); click →
  the report behind it (server-cache-served within TTL, else re-assessed); a Clear link; empty → nothing.

## Trust / quality properties (must hold)

1. **No server, no tracking** — client-local only.
2. **Free entry preserved** — the list never restricts; any valid `owner/repo` still submits.
3. **Hydration-safe** — client-local data renders nothing server-side, populates on mount (no mismatch).
4. **Accessible** — proper combobox ARIA + full keyboard; Lighthouse a11y stays clean.
5. **Deterministic ordering** — A→Z for the static seeds; recency for recent; trustscope pinned.

## Testing

1. **Unit `recent-repos`** — add / dedup / cap / clear / most-recent-first, over an injected storage.
2. **Unit list model** — `seeds ∪ recent` dedup, ordering (pin → recency → A→Z), substring filter.
3. **e2e** — typing filters the list; selecting navigates; free entry of a **non-listed** repo still
   works; viewing a report makes it appear in the strip + combobox; Clear empties the strip.

## Out of scope / route elsewhere

- **Login / per-user server history (D7)** — future; this client-local path coexists as the no-login experience.
- **Report preview in the list (Variant B)** — deferred (R3 duplication + staleness in the browser).
- **Curated famous-repos expansion** — the seeds list can grow; start with 2–3.
- **Cross-device sync** — needs login (D7).

## Hand-off (revised orchestration)

Design approved (Founder, 2026-07-04). **Linus writes the implementation plan → MASCHIN reviews the
plan → Linus builds (TDD, gates green) → Founder visual-accepts both surfaces.**
