# Preview-environment OAuth (issue-filing) — prep & decision

Brief item 5 — **preparation only**; enabling this is an owner decision (needs credentials).

## Current state (by design — not broken)

One-click "file as yourself" needs a GitHub OAuth App (`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
+ `AUTH_SECRET`). Those are set in **Production only**. On **Preview** (and local dev) `oauthConfigured`
is false, so `/api/file-issue` returns `501` and the UI degrades to the **credential-free fallbacks**:
Copy-Markdown + a pre-filled GitHub issue URL. Those are still the user's own authenticated action —
**consent intact, no bot** (DECISIONS §6). So Preview is fully usable; only the one-click path is absent.

## Why enabling it on Preview is awkward

1. **Dynamic preview URLs.** Every preview deployment gets a random host
   (`trustscope-<hash>-…vercel.app`). A GitHub OAuth App matches its **Authorization callback URL**
   by host — it does not support wildcard subdomains. So per-deployment URLs can't each be a valid
   callback without a stable host.
2. **Deployment Protection (SSO).** Preview deployments sit behind Vercel Authentication; the OAuth
   round-trip would have to traverse that too.
3. **`AUTH_URL` must be stable.** NextAuth derives the callback from the request host unless `AUTH_URL`
   is pinned; on a random preview host the callback won't match what's registered.

That combination is exactly why v1 chose the fallback for Preview.

## What it would take (if enabled)

1. **Stable preview alias** — assign a fixed domain to preview (e.g. `preview.trustscope.neckarshore.ai`)
   so there is one host to register and pin.
2. **OAuth App callback** — register `https://preview.trustscope.neckarshore.ai/api/auth/callback/github`
   (either add it to the existing App if single-callback suffices, or create a **separate preview OAuth App**).
3. **Preview env vars** (Vercel → trustscope → Settings → Environment Variables, scope **Preview**):
   | Name | Value |
   |------|-------|
   | `GITHUB_CLIENT_ID` | preview OAuth App client id |
   | `GITHUB_CLIENT_SECRET` | preview OAuth App client secret |
   | `AUTH_SECRET` | a fresh secret (`openssl rand -base64 32`) |
   | `AUTH_URL` | `https://preview.trustscope.neckarshore.ai` (pin the callback host) |
4. **Deployment Protection** — allow the alias / the OAuth flow through it, or accept that only the
   aliased preview (not per-PR URLs) supports one-click filing.
5. Redeploy preview; verify the sign-in → file-issue round-trip on the alias.

## 👤 OWNER — decision

**Recommendation: skip for v1.** The Copy-Markdown / pre-filled fallback covers Preview with consent
intact; one-click filing on ephemeral preview builds is low value against the alias + SSO complexity.
Revisit only if preview-time issue-filing becomes a real need — then follow the steps above.
