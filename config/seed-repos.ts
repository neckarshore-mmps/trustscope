export interface SeedRepo {
  owner: string;
  repo: string;
  /** Pinned entries sort to the very top (dogfood default). */
  pinned?: boolean;
}

/** Always-present suggestions. trustscope is the pinned dogfood default; the rest are famous examples. */
export const SEED_REPOS: SeedRepo[] = [
  { owner: "neckarshore-mmps", repo: "trustscope", pinned: true },
  { owner: "ossf", repo: "scorecard" },
  { owner: "sindresorhus", repo: "got" },
];
