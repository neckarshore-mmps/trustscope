import { ImageResponse } from "next/og";
import { parseRepoInput } from "@/lib/parse-repo-input";
import { getReportStore } from "@/lib/store";
import { CACHE_TTL_MS } from "@/lib/resolve-report";
import { buildOgCardData, type OgPillarCell } from "@/lib/og-card";
import { BODO_DISC_GRAY_DATA_URI } from "@/lib/bodo-og";
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

// Label-only tiles (the three free pillars, no scores) when there is no valid repo — derived
// from the same helper so hues/order can't drift from the scored path.
const FALLBACK_PILLARS: OgPillarCell[] = buildOgCardData({ owner: "", repo: "" }, null).pillars;

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
          {/* Bodo on the gray brand disc — same mark as header / favicon / social card.
              Satori (@vercel/og) renders raw <img>, not the DOM — next/image N/A here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BODO_DISC_GRAY_DATA_URI}
            width={40}
            height={40}
            alt=""
            style={{ display: "flex" }}
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

        {/* Pillar row — real Scoreboard tiles: hue eyebrow, direction-coloured score, intensity bar */}
        <div style={{ display: "flex", gap: 20 }}>
          {(card?.pillars ?? FALLBACK_PILLARS).map((p) => (
            <div
              key={p.id}
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
              <div
                style={{
                  display: "flex",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: p.hue,
                }}
              >
                Pillar {p.id}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 19,
                  color: FG,
                  fontWeight: 600,
                  marginTop: 8,
                  lineHeight: 1.15,
                }}
              >
                {p.title}
              </div>
              {p.score === null ? (
                <div style={{ display: "flex", fontSize: 22, color: MUTED, marginTop: 16 }}>
                  Not assessed
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "baseline", marginTop: 16 }}>
                  <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: p.scoreHex }}>
                    {p.score.toFixed(1)}
                  </div>
                  <div style={{ display: "flex", fontSize: 20, color: MUTED, marginLeft: 8 }}>
                    / 10
                  </div>
                </div>
              )}
              {/* Intensity bar — length = distance from a neutral 5, colour = direction */}
              <div
                style={{
                  display: "flex",
                  marginTop: 18,
                  height: 6,
                  width: "100%",
                  borderRadius: 999,
                  backgroundColor: BORDER,
                }}
              >
                {p.score !== null && (
                  <div
                    style={{
                      display: "flex",
                      height: 6,
                      width: `${p.fill}%`,
                      borderRadius: 999,
                      backgroundColor: p.barHex,
                    }}
                  />
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
