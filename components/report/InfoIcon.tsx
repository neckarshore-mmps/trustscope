/**
 * Placeholder info affordance — md-viewer icon system (flat Material inline-SVG, colour via
 * currentColor). Behaviour is wired later: an on-site plain-language explainer of what a check or
 * score means (own content for SEO/GEO, replacing the raw OpenSSF doc link). Non-functional for now.
 */
export function InfoIcon({ label }: { label?: string }) {
  return (
    <button
      type="button"
      title="More info — coming soon"
      aria-label={label ? `More about ${label}` : "More info"}
      className="ml-1 inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full align-middle text-muted/70 transition-colors hover:text-brand"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 fill-current">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    </button>
  );
}
