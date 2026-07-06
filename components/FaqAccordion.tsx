import type { FaqItem } from "@/config/faq";

/**
 * The one shared FAQ interface — bordered `<details>` cards with a rotating `+`,
 * accent on open. Used by /faq (general) and both /for persona pages. The first
 * item renders open. `accent` is any CSS color for the open-state border + `+`.
 */
export function FaqAccordion({
  items,
  accent = "var(--brand)",
}: {
  items: readonly FaqItem[];
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5" style={{ ["--fa" as string]: accent }}>
      {items.map((f, i) => (
        <details
          key={f.q}
          open={i === 0}
          className="group overflow-hidden rounded-xl border border-border bg-surface open:border-[color-mix(in_srgb,var(--fa)_45%,transparent)]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-semibold [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid h-5 w-5 flex-none place-items-center rounded-md border border-border text-muted transition-transform group-open:rotate-45 group-open:text-[var(--fa)]">
              +
            </span>
          </summary>
          <div className="px-4 pb-4 text-[13.5px] leading-relaxed text-muted">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
