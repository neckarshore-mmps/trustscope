#!/usr/bin/env node
/**
 * IndexNow submitter — pings the IndexNow API (Bing, Yandex, Naver, Seznam) with the
 * site's current sitemap URLs so those engines re-crawl changed pages on demand
 * instead of waiting for a scheduled pull. Google does not consume IndexNow.
 *
 * TIMING MATTERS: run this AFTER a production deploy is live — the URLs must already
 * serve the new content when the engines crawl. Wire it to a Vercel Deploy Hook or a
 * post-deploy GitHub Action; do NOT put it in `next build` (that fires on previews and
 * before the new deployment is serving). It only ever submits the production host.
 *
 * Ownership is proven by the key file published at
 * https://trustscope.neckarshore.ai/<key>.txt (see public/). The engines fetch that
 * keyLocation before accepting the URL list.
 *
 * Usage:  node scripts/indexnow.mjs [--dry-run]
 */
import process from "node:process";
import { pathToFileURL } from "node:url";

export const HOST = "trustscope.neckarshore.ai";
export const KEY = "443275063d61ddc7f81d422a08dc7b14";
const SITEMAP = `https://${HOST}/sitemap.xml`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

/** Extract the <loc> URLs from a sitemap XML string. */
export function parseLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

/** Build the IndexNow POST body for a set of URLs. */
export function buildPayload(urls) {
  return {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const res = await fetch(SITEMAP);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const urls = parseLocs(await res.text());
  if (urls.length === 0) throw new Error("no URLs parsed from sitemap");

  const payload = buildPayload(urls);
  console.log(`IndexNow: ${urls.length} URL(s) for ${HOST}`);
  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const post = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  console.log(`IndexNow response: ${post.status} ${post.statusText}`);
  // 200 = accepted, 202 = accepted (pending key validation). Anything else is a failure.
  if (post.status !== 200 && post.status !== 202) {
    throw new Error(`IndexNow submit failed: ${post.status}`);
  }
}

// Run only when executed directly — stays inert when imported by the smoke test.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
