import { badgeSvg } from "@/lib/badge-svg";

// B4: the README-embeddable trust badge. Label-only (no score) + repo-agnostic — the
// per-repo link that wraps it (in the copy-snippet) carries the repo. Static output, so
// it caches hard and never touches the report pipeline.
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(badgeSvg(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
    },
  });
}
