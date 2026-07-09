import type { Metadata } from "next";
import { CHANGELOG } from "@/config/changelog";
import { APP_VERSION } from "@/config/version";

export const metadata: Metadata = {
  title: "Changelog",
  description: `What changed in TrustScope, newest first. Current version v${APP_VERSION}.`,
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Changelog</h1>
      <p className="mt-2 text-sm text-muted">
        What changed in TrustScope, newest first — currently{" "}
        <span className="font-mono">v{APP_VERSION}</span>.
      </p>

      <ol className="mt-10 space-y-10">
        {CHANGELOG.map((entry) => (
          <li key={entry.version}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                <span className="font-mono text-brand">v{entry.version}</span>
              </h2>
              <span className="text-sm text-muted">{fmtDate(entry.date)}</span>
            </div>
            <ul className="mt-3 space-y-2">
              {entry.changes.map((c) => (
                <li key={c} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand/60" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
