import type { InstallHook, ManifestData } from "@/lib/report-core/types";
import { GITHUB_API, ghHeaders, type GitHubFetchOptions } from "./github";

/** The npm hooks that execute automatically on `npm install`, in canonical order. */
const INSTALL_HOOKS: InstallHook[] = ["preinstall", "install", "postinstall"];

/** Hard deadline so a slow/hanging GitHub response degrades to `null` instead of blocking the report. */
const MANIFEST_FETCH_TIMEOUT_MS = 5000;

/**
 * Manifest adapter (batch-2 due-diligence seam). Reads the repo's ROOT package.json and reports
 * which auto-run install hooks it declares. Best-effort BY DESIGN: any failure (404, non-JSON,
 * rate-limit, network, **timeout**) resolves to `null` so the report never dies on this source.
 * A successfully-parsed manifest with no install hooks returns `{ installHooks: [] }` (see the shape
 * contract in the spec): `null` = missing / not npm / failed fetch; `[]` = parsed, no install hooks.
 */
export async function fetchPackageManifest(
  owner: string,
  repo: string,
  opts: GitHubFetchOptions = {},
): Promise<ManifestData | null> {
  const fetchImpl = opts.fetchFn ?? fetch;
  const token = opts.githubToken ?? process.env.GITHUB_AUTH_TOKEN;
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), MANIFEST_FETCH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${GITHUB_API}/repos/${owner}/${repo}/contents/package.json`, {
      headers: ghHeaders(token),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { content?: unknown };
    if (typeof body.content !== "string") return null;
    const pkg = JSON.parse(Buffer.from(body.content, "base64").toString("utf8")) as {
      scripts?: Record<string, unknown>;
    };
    const scripts = pkg.scripts;
    if (!scripts || typeof scripts !== "object") return { installHooks: [] };
    const installHooks = INSTALL_HOOKS.filter(
      (h) => typeof scripts[h] === "string" && (scripts[h] as string).trim() !== "",
    );
    return { installHooks };
  } catch {
    // includes the AbortError thrown when the deadline fires
    return null;
  } finally {
    clearTimeout(deadline);
  }
}
