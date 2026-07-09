import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Ideas, bugs, or a thank-you for TrustScope.",
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Feedback</h1>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
        A proper feedback channel is on the way. For now, ideas and bugs are most welcome as
        GitHub issues.
      </p>
      <a
        href="https://github.com/neckarshore-mmps/trustscope/issues"
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex items-center rounded-lg border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium transition-colors hover:border-brand/40"
      >
        Open an issue on GitHub ↗
      </a>
    </div>
  );
}
