import { RepoForm } from "@/components/RepoForm";

/**
 * Shared conversion CTA for the informational pages (how-it-works, faq, about) — the
 * pages guide/definitional queries land on, which previously had no repo-paste box, only
 * a text link. Uses RepoForm's default solid-brand submit (AA-safe in both themes), not
 * the homepage gradient variant.
 */
export function TryItCta({ heading = "Try it on a repo" }: { heading?: string }) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-12">
      <div className="rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Paste any public GitHub repository — no sign-in needed to read a report.
        </p>
        <div className="mx-auto mt-5 max-w-md text-left">
          <RepoForm submitLabel="Run the report →" />
        </div>
      </div>
    </section>
  );
}
