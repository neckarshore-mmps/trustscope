import type { Metadata } from "next";
import { parseRepoInput } from "@/lib/parse-repo-input";
import { PRODUCT_NAME } from "@/config/product";
import { resolveReport } from "@/lib/resolve-report";
import { RecordView } from "@/components/RecordView";
import { ReportError } from "@/components/report/ReportError";
import { ReportView } from "@/components/report/ReportView";

// Report generation touches the network — never cache/prerender.
export const dynamic = "force-dynamic";
// 300s (Vercel Pro): headroom for the ~90s on-demand Scorecard run to happen ON Vercel via a
// Fluid-Compute function running the scorecard binary (§7 #4). Fast-path returns in seconds.
export const maxDuration = 300;

type SearchParams = Promise<{ repo?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { repo } = await searchParams;
  const parsed = repo ? parseRepoInput(repo) : null;
  const title = parsed ? `${parsed.owner}/${parsed.repo}` : "Report";

  // B1: a per-report social card so a shared /report?repo=X link unfurls the visitor's
  // OWN repo + its three pillars, not the static homepage card. Falls back to the layout's
  // default card for an invalid/absent repo.
  if (!parsed) return { title, robots: { index: false, follow: true } };

  const slug = `${parsed.owner}/${parsed.repo}`;
  const ogUrl = `/report/og?repo=${encodeURIComponent(slug)}`;
  const description = `How far can you trust ${slug}? A three-pillar trust report — security & supply chain, governance, community — with no single aggregate score.`;

  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: {
      title: `${slug} · ${PRODUCT_NAME} trust report`,
      description,
      type: "article",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${PRODUCT_NAME} trust report for ${slug}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${slug} · ${PRODUCT_NAME}`,
      description,
      images: [ogUrl],
    },
  };
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { repo } = await searchParams;
  const parsed = repo ? parseRepoInput(repo) : null;

  if (!parsed) {
    return (
      <ReportError
        title="That doesn’t look like a repository"
        message="Enter a public GitHub repo as owner/repo (e.g. ossf/scorecard) or a full github.com URL."
      />
    );
  }

  // Resolve to a plain outcome first; render JSX outside the try/catch
  // (react-hooks/error-boundaries: no JSX construction inside try/catch).
  const outcome = await resolveReport(parsed);

  if (outcome.kind === "error") {
    return <ReportError title={outcome.title} message={outcome.message} />;
  }
  return (
    <>
      <RecordView
        owner={outcome.report.repo.owner}
        repo={outcome.report.repo.name}
      />
      <ReportView
        report={outcome.report}
        source={outcome.source}
        cached={outcome.cached}
      />
    </>
  );
}
