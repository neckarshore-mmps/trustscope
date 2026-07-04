export interface RecentRepo {
  owner: string;
  repo: string;
  /** ISO timestamp of the most recent view. */
  viewedAt: string;
}

export interface RecentStore {
  read(): string | null;
  write(value: string): void;
}

const KEY = "trustscope:recent-repos";
export const MAX_RECENT = 8;

const slug = (r: { owner: string; repo: string }) => `${r.owner}/${r.repo}`;

export function getRecentRepos(store: RecentStore): RecentRepo[] {
  let raw: string | null;
  try {
    raw = store.read();
  } catch {
    return [];
  }
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const clean = parsed.filter(
    (e): e is RecentRepo =>
      !!e &&
      typeof e.owner === "string" &&
      typeof e.repo === "string" &&
      typeof e.viewedAt === "string",
  );
  // Newest first. Secondary slug key makes this a TOTAL order: without it, equal
  // viewedAt returns -1 (a broken comparator) → order depends on input position.
  return clean
    .sort((a, b) =>
      a.viewedAt < b.viewedAt
        ? 1
        : a.viewedAt > b.viewedAt
          ? -1
          : slug(a).localeCompare(slug(b)),
    )
    .slice(0, MAX_RECENT);
}

export function addRecentRepo(
  store: RecentStore,
  ref: { owner: string; repo: string },
  now: string,
): void {
  const rest = getRecentRepos(store).filter(
    (e) => !(e.owner === ref.owner && e.repo === ref.repo),
  );
  const next = [{ owner: ref.owner, repo: ref.repo, viewedAt: now }, ...rest].slice(
    0,
    MAX_RECENT,
  );
  store.write(JSON.stringify(next));
}

export function clearRecentRepos(store: RecentStore): void {
  store.write("[]");
}

/** Browser-backed store; SSR-safe (no-op when window is absent). */
export function browserRecentStore(): RecentStore {
  if (typeof window === "undefined") return { read: () => null, write: () => {} };
  return {
    read: () => window.localStorage.getItem(KEY),
    // Best-effort: setItem throws in Safari private mode / on quota-exceeded.
    // Guard it so a full or restricted store never breaks record-on-view.
    write: (v) => {
      try {
        window.localStorage.setItem(KEY, v);
      } catch {
        /* best-effort — never throw */
      }
    },
  };
}
