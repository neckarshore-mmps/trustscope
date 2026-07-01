export default function ReportLoading() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand" />
      <h1 className="mt-6 text-lg font-semibold tracking-tight">Assessing the repository…</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
        Fetching the OpenSSF Scorecard and GitHub signals. Repos already in the OpenSSF dataset
        return in a second; others are scored on demand, which can take up to a minute or two.
      </p>
    </div>
  );
}
