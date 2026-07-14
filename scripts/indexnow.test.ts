import { describe, it, expect } from "vitest";
import { parseLocs, buildPayload, HOST, KEY } from "./indexnow.mjs";

describe("indexnow", () => {
  it("parses <loc> URLs from sitemap XML", () => {
    const xml =
      "<urlset><url><loc>https://x/a</loc></url><url><loc>https://x/b</loc></url></urlset>";
    expect(parseLocs(xml)).toEqual(["https://x/a", "https://x/b"]);
  });

  it("tolerates whitespace and returns [] for an empty sitemap", () => {
    expect(parseLocs("<urlset>\n  <url><loc> https://x/a </loc></url>\n</urlset>")).toEqual([
      "https://x/a",
    ]);
    expect(parseLocs("<urlset></urlset>")).toEqual([]);
  });

  it("builds a valid IndexNow payload with the published keyLocation", () => {
    expect(buildPayload(["https://x/a"])).toEqual({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: ["https://x/a"],
    });
  });

  it("uses a 32-hex IndexNow key", () => {
    expect(KEY).toMatch(/^[0-9a-f]{32}$/);
  });
});
