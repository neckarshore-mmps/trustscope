import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Integration test for the "file as yourself" route (work-order §5 Phase 4).
 * The real GitHub OAuth handshake is not CI-testable (needs a real user + would file
 * real issues), so we mock `@/auth` (`oauthConfigured` + `auth()`) and the outbound
 * `fetch` to GitHub, and assert every branch of the env-gate + that a signed-in call
 * POSTs AS the user (their own bearer token) — the whole point of the feature.
 */

type Session = { accessToken?: string } | null;

async function loadPOST(opts: { oauthConfigured: boolean; session?: Session }) {
  vi.resetModules();
  vi.doMock("@/auth", () => ({
    oauthConfigured: opts.oauthConfigured,
    auth: vi.fn(async () => opts.session ?? null),
  }));
  const mod = await import("./route");
  return mod.POST;
}

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://trustscope.neckarshore.ai/api/file-issue", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validPayload = {
  owner: "ossf",
  repo: "scorecard",
  title: "TrustScope: suggested improvements",
  body: "Body with fixes.",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.doUnmock("@/auth");
});

describe("POST /api/file-issue", () => {
  it("returns 501 when OAuth is not configured", async () => {
    const POST = await loadPOST({ oauthConfigured: false });
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(501);
    const json = await res.json();
    expect(json.error).toMatch(/not configured/i);
  });

  it("returns 401 + a signInUrl carrying the report as callbackUrl when signed out", async () => {
    const POST = await loadPOST({ oauthConfigured: true, session: null });
    const referer = "https://trustscope.neckarshore.ai/report?repo=ossf/scorecard";
    const res = await POST(makeRequest(validPayload, { referer }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.signInUrl).toContain("/api/auth/signin?callbackUrl=");
    expect(json.signInUrl).toContain(encodeURIComponent(referer));
  });

  it("falls back to '/' as callbackUrl when there is no referer", async () => {
    const POST = await loadPOST({ oauthConfigured: true, session: null });
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.signInUrl).toBe(`/api/auth/signin?callbackUrl=${encodeURIComponent("/")}`);
  });

  it("returns 400 on invalid JSON (signed in)", async () => {
    const POST = await loadPOST({ oauthConfigured: true, session: { accessToken: "gho_user" } });
    const res = await POST(makeRequest("{ not json", {}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when owner/repo/title/body is missing (signed in)", async () => {
    const POST = await loadPOST({ oauthConfigured: true, session: { accessToken: "gho_user" } });
    const res = await POST(makeRequest({ owner: "ossf", repo: "scorecard" }));
    expect(res.status).toBe(400);
  });

  it("files the issue AS the user (their bearer token) and returns the new issue URL", async () => {
    const POST = await loadPOST({ oauthConfigured: true, session: { accessToken: "gho_user" } });
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ html_url: "https://github.com/ossf/scorecard/issues/1" }),
      text: async () => "",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe("https://github.com/ossf/scorecard/issues/1");

    // The security-critical assertion: acts AS the user, on the reported repo.
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/ossf/scorecard/issues",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ authorization: "Bearer gho_user" }),
      }),
    );
  });

  it("returns 502 when GitHub rejects the issue", async () => {
    const POST = await loadPOST({ oauthConfigured: true, session: { accessToken: "gho_user" } });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 422,
        text: async () => "Validation failed",
      })),
    );
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toMatch(/HTTP 422/);
  });
});
