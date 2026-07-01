import type { FindingStatus } from "@/lib/report-core/types";

/** Visual metadata per finding status. */
export const STATUS_META: Record<
  FindingStatus,
  { label: string; dot: string; text: string; badge: string }
> = {
  pass: {
    label: "Pass",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    badge: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25",
  },
  warn: {
    label: "Needs work",
    dot: "bg-amber-400",
    text: "text-amber-300",
    badge: "bg-amber-500/10 text-amber-300 ring-amber-500/25",
  },
  fail: {
    label: "Gap",
    dot: "bg-rose-400",
    text: "text-rose-300",
    badge: "bg-rose-500/10 text-rose-300 ring-rose-500/25",
  },
  inconclusive: {
    label: "Inconclusive",
    dot: "bg-slate-500",
    text: "text-slate-400",
    badge: "bg-slate-500/10 text-slate-400 ring-slate-500/25",
  },
  info: {
    label: "Context",
    dot: "bg-sky-400",
    text: "text-sky-300",
    badge: "bg-sky-500/10 text-sky-300 ring-sky-500/25",
  },
};

/** Text colour for a 0–10 pillar score (or null = not-assessed). */
export function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-400";
  if (score >= 8) return "text-emerald-300";
  if (score >= 4) return "text-amber-300";
  return "text-rose-300";
}

/** Ring colour for the score ring. */
export function scoreRing(score: number | null): string {
  if (score === null) return "text-slate-600";
  if (score >= 8) return "text-emerald-400";
  if (score >= 4) return "text-amber-400";
  return "text-rose-400";
}
