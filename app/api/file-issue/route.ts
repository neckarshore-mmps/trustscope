import { NextResponse } from "next/server";
import { auth, oauthConfigured } from "@/auth";
import { parseRepoInput } from "@/lib/parse-repo-input";

/**
 * File the constructive issue AS the authenticated user (work-order §5 Phase 4).
 * - Not configured -> 501 (the UI shows the credential-free fallbacks instead).
 * - Configured but not signed in -> 401 with a signInUrl (the UI redirects to GitHub).
 * - Signed in -> POST the issue with the user's own OAuth token; return the new issue URL.
 */
export async function POST(request: Request) {
  if (!oauthConfigured) {
    return NextResponse.json(
      {
        error:
          "One-click filing is not configured on this instance. Use Copy Markdown or the pre-filled issue link.",
      },
      { status: 501 },
    );
  }

  const session = await auth();
  const token = session?.accessToken;
  if (!session || !token) {
    const callbackUrl = request.headers.get("referer") ?? "/";
    return NextResponse.json(
      {
        error: "Sign in with GitHub to file the issue as yourself.",
        signInUrl: `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      },
      { status: 401 },
    );
  }

  let payload: { owner?: string; repo?: string; title?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseRepoInput(`${payload.owner ?? ""}/${payload.repo ?? ""}`);
  if (!parsed || !payload.title || !payload.body) {
    return NextResponse.json(
      { error: "Missing or invalid owner/repo/title/body." },
      { status: 400 },
    );
  }

  const res = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/issues`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "content-type": "application/json",
        "user-agent": "TrustScope",
      },
      body: JSON.stringify({ title: String(payload.title), body: String(payload.body) }),
    },
  );

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    return NextResponse.json(
      { error: `GitHub rejected the issue (HTTP ${res.status}).`, detail },
      { status: 502 },
    );
  }

  const created = (await res.json()) as { html_url?: string };
  return NextResponse.json({ url: created.html_url });
}
