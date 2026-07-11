import pkg from "@/package.json";

/**
 * App version, single-sourced from package.json (no drift), plus the deploy's short git SHA.
 * `VERCEL_GIT_COMMIT_SHA` is injected on Vercel; falls back to "dev" for local builds.
 * Server-only value — read it from Server Components (the footer), never a Client Component.
 */
export const APP_VERSION: string = pkg.version;

/** Full deploy SHA (empty on local builds where `VERCEL_GIT_COMMIT_SHA` is unset). */
export const GIT_SHA_FULL: string = process.env.VERCEL_GIT_COMMIT_SHA ?? "";

/** Short deploy SHA for display. */
export const GIT_SHA: string = GIT_SHA_FULL.slice(0, 7);

/** Link to the exact deployed commit (AD-42 variant-A footer), or null on local builds. */
export const COMMIT_URL: string | null = GIT_SHA_FULL
  ? `https://github.com/neckarshore-mmps/trustscope/commit/${GIT_SHA_FULL}`
  : null;
