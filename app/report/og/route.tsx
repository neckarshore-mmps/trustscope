import { ImageResponse } from "next/og";
import { parseRepoInput } from "@/lib/parse-repo-input";
import { getReportStore } from "@/lib/store";
import { CACHE_TTL_MS } from "@/lib/resolve-report";
import { buildOgCardData } from "@/lib/og-card";
import type { ReportModel } from "@/lib/report-core/types";
import { PRODUCT_NAME } from "@/config/product";

// Node runtime: the cache read touches the report store. NEVER generates a report — a
// cache miss is a graceful fallback (repo name + pillar dimensions, no scores), so the
// ~90s pipeline is never on a social crawler's timeout path.
export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 } as const;

// Brand palette (globals.css, dark). Satori needs explicit colors — no Tailwind here.
const BG = "#090d13";
const SURFACE = "#0f1620";
const BORDER = "#223041";
const FG = "#e6edf3";
const MUTED = "#90a1b6";
const BRAND = "#2dd4bf";

/** Cache-only read: a stored report within the TTL, else null. Never throws, never generates. */
async function readCachedReport(parsed: {
  owner: string;
  repo: string;
}): Promise<ReportModel | null> {
  try {
    const stored = await getReportStore().getLatest(parsed.owner, parsed.repo);
    if (stored && Date.now() - Date.parse(stored.fetchedAt) < CACHE_TTL_MS) {
      return stored.report;
    }
  } catch {
    // A flaky store is a cache miss, never a card failure.
  }
  return null;
}

export async function GET(req: Request): Promise<Response> {
  const repoParam = new URL(req.url).searchParams.get("repo");
  const parsed = repoParam ? parseRepoInput(repoParam) : null;
  const card = parsed ? buildOgCardData(parsed, await readCachedReport(parsed)) : null;

  const repoLabel = card?.repoLabel ?? PRODUCT_NAME;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BG,
          padding: "68px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              backgroundColor: BRAND,
              display: "flex",
            }}
          />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: FG }}>
            {PRODUCT_NAME}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: MUTED, marginLeft: 8 }}>
            open-source trust reports
          </div>
        </div>

        {/* Repo + framing */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, color: MUTED, marginBottom: 12 }}>
            Trust report for
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 700,
              color: FG,
              lineHeight: 1.05,
            }}
          >
            {repoLabel}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: MUTED, marginTop: 18 }}>
            Three pillars of trust. No single aggregate score — by design.
          </div>
        </div>

        {/* Pillar row */}
        <div style={{ display: "flex", gap: 20 }}>
          {(
            card?.pillars ?? [
              { title: "Security & Supply Chain", hue: "#6ee7b7", score: null },
              { title: "Trust & Governance", hue: "#7dd3fc", score: null },
              { title: "Community & Sustainability", hue: "#fcd34d", score: null },
            ]
          ).map((p) => (
            <div
              key={p.title}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: "22px 24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: p.hue,
                    display: "flex",
                  }}
                />
                <div style={{ display: "flex", fontSize: 19, color: FG, fontWeight: 600 }}>
                  {p.title}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  marginTop: 16,
                  color: p.score === null ? MUTED : FG,
                }}
              >
                <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
                  {p.score === null ? "—" : p.score.toFixed(1)}
                </div>
                {p.score !== null && (
                  <div style={{ display: "flex", fontSize: 20, color: MUTED, marginLeft: 6 }}>
                    / 10
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        // Unfurlers refetch; render once, serve from cache. SWR keeps a fresh score
        // trickling in without ever blocking a crawler.
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
