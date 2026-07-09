import { describe, expect, it, vi } from "vitest";
import { fetchPackageManifest } from "./manifest";

function res(status: number, json: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => json } as Response;
}
function contents(pkg: unknown) {
  return res(200, {
    content: Buffer.from(JSON.stringify(pkg), "utf8").toString("base64"),
    encoding: "base64",
  });
}
const asFetch = (fn: unknown) => fn as unknown as typeof fetch;

describe("fetchPackageManifest", () => {
  it("extracts the auto-run install hooks present, in canonical order", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        contents({ scripts: { postinstall: "node build.js", preinstall: "echo hi", test: "vitest" } }),
      );
    expect(await fetchPackageManifest("o", "r", { fetchFn: asFetch(fetchFn) })).toEqual({
      installHooks: ["preinstall", "postinstall"],
    });
  });
  it("returns [] (parsed, no hooks) for scripts without install hooks AND for a manifest with no scripts key", async () => {
    const withScripts = vi.fn().mockResolvedValue(contents({ scripts: { build: "tsc" } }));
    expect(await fetchPackageManifest("o", "r", { fetchFn: asFetch(withScripts) })).toEqual({
      installHooks: [],
    });
    const noScripts = vi.fn().mockResolvedValue(contents({ name: "pkg" }));
    expect(await fetchPackageManifest("o", "r", { fetchFn: asFetch(noScripts) })).toEqual({
      installHooks: [],
    });
  });
  it("returns null on 404, non-JSON, and a rejected/aborted fetch — never throws", async () => {
    expect(
      await fetchPackageManifest("o", "r", {
        fetchFn: asFetch(vi.fn().mockResolvedValue(res(404, {}))),
      }),
    ).toBeNull();
    const bad = res(200, undefined);
    (bad as { json: () => Promise<unknown> }).json = async () => {
      throw new Error("bad");
    };
    expect(
      await fetchPackageManifest("o", "r", { fetchFn: asFetch(vi.fn().mockResolvedValue(bad)) }),
    ).toBeNull();
    expect(
      await fetchPackageManifest("o", "r", {
        fetchFn: asFetch(vi.fn().mockRejectedValue(new Error("net"))),
      }),
    ).toBeNull();
  });
});
