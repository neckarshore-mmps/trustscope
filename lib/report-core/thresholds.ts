/**
 * §4 — the single source of truth for score bands + the activity window.
 *
 * These were duplicated across build-report, report-summary, due-diligence, and ui — a change to any
 * one drifted the others silently (one call site even had a comment admitting the coupling). Every
 * consumer now imports from here; the literals 8 / 3 / 90 and `daysBetween` live in exactly one place.
 */

/** score >= PASS_THRESHOLD -> pass / "strong". */
export const PASS_THRESHOLD = 8;
/** score <= FAIL_THRESHOLD -> fail / "concern"; strictly in-between -> warn / "moderate". */
export const FAIL_THRESHOLD = 3;
/** A repo pushed within this many days of assessment counts as "recently active". */
export const ACTIVITY_WINDOW_DAYS = 90;

/** Absolute whole-day distance between two ISO timestamps, or null if either is unparseable. */
export function daysBetween(aIso: string, bIso: string): number | null {
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.abs(a - b) / 86_400_000;
}
