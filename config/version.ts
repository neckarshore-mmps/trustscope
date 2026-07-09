import pkg from "@/package.json";

/**
 * App version, single-sourced from package.json (no drift), plus the deploy's short git SHA.
 * `VERCEL_GIT_COMMIT_SHA` is injected on Vercel; falls back to "dev" for local builds.
 * Server-only value — read it from Server Components (the footer), never a Client Component.
 */
export const APP_VERSION: string = pkg.version;
export const GIT_SHA: string = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7);
