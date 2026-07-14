import { PASS_THRESHOLD } from "@/lib/report-core/thresholds";
import type { FindingStatus } from "@/lib/report-core/types";

/** Visual metadata per finding status. */
export const STATUS_META: Record<
  FindingStatus,
  { label: string; dot: string; text: string; badge: string }
> = {
  // `text`/`badge` carry a `light:` override: the vivid -300 shades read on the dark
  // ground but fail WCAG AA as text on a light one. `text` sits on the page surface
  // (-> -700); `badge` text sits on its own -500/10 tint (-> -800 to clear 4.5:1).
  pass: {
    label: "Pass",
    dot: "bg-emerald-400",
    text: "text-emerald-300 light:text-emerald-700",
    badge: "bg-emerald-500/10 text-emerald-300 light:text-emerald-800 ring-emerald-500/25",
  },
  warn: {
    label: "Needs work",
    dot: "bg-amber-400",
    text: "text-amber-300 light:text-amber-700",
    badge: "bg-amber-500/10 text-amber-300 light:text-amber-800 ring-amber-500/25",
  },
  fail: {
    label: "Gap",
    dot: "bg-rose-400",
    text: "text-rose-300 light:text-rose-700",
    badge: "bg-rose-500/10 text-rose-300 light:text-rose-800 ring-rose-500/25",
  },
  inconclusive: {
    label: "Inconclusive",
    dot: "bg-slate-500",
    text: "text-slate-400 light:text-slate-600",
    badge: "bg-slate-500/10 text-slate-400 light:text-slate-600 ring-slate-500/25",
  },
  info: {
    label: "Context",
    dot: "bg-sky-400",
    text: "text-sky-300 light:text-sky-700",
    badge: "bg-sky-500/10 text-sky-300 light:text-sky-800 ring-sky-500/25",
  },
};

// The "strong" colour floor shares PASS_THRESHOLD (§4); the amber/rose split is a display-only
// midpoint (>= 4), deliberately NOT the fail threshold, so fractional means in (3,4] stay amber.
const AMBER_FLOOR = 4;

/**
 * Text colour for a 0–10 pillar score (or null = not-assessed). Each carries a
 * `light:text-*-700` override — the vivid -300 shade fails WCAG AA as a large
 * numeral on the light ground, the -700 sibling of the same hue passes.
 */
export function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-400 light:text-slate-600";
  if (score >= PASS_THRESHOLD) return "text-emerald-300 light:text-emerald-700";
  if (score >= AMBER_FLOOR) return "text-amber-300 light:text-amber-700";
  return "text-rose-300 light:text-rose-700";
}

/** Ring colour for the score ring. */
export function scoreRing(score: number | null): string {
  if (score === null) return "text-slate-600";
  if (score >= PASS_THRESHOLD) return "text-emerald-400";
  if (score >= AMBER_FLOOR) return "text-amber-400";
  return "text-rose-400";
}

/** Background fill class for a score meter bar (mirrors scoreRing's bands). */
export function scoreBar(score: number | null): string {
  if (score === null) return "bg-slate-600";
  if (score >= PASS_THRESHOLD) return "bg-emerald-400";
  if (score >= AMBER_FLOOR) return "bg-amber-400";
  return "bg-rose-400";
}
