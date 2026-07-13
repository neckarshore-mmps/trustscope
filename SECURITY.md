# Security Policy

TrustScope is an open-source trust report by Neckarshore AI — paste a public GitHub
repository and get a deterministic three-pillar trust report, built on the
[OpenSSF Scorecard](https://securityscorecards.dev). A tool whose whole job is
assessing the security posture of *other* projects has to hold itself to the
same bar. This public repository holds its source.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Live production (`main`) | Yes |
| Any previous commit / preview deploy | No |

TrustScope is continuously deployed from `main`. Only what is live in
production receives security fixes — there are no maintained release branches.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security problems.** Public
disclosure before a fix is shipped puts users at risk.

Use a private channel instead — either is fine:

1. **GitHub private vulnerability reporting (preferred):**
   [Report a vulnerability](https://github.com/neckarshore-mmps/trustscope/security/advisories/new)
   — opens a private security advisory only maintainers can see.
2. **Email:** [info@neckarshore.ai](mailto:info@neckarshore.ai).

Please include:

1. **What you found** — a description of the vulnerability.
2. **How to reproduce** — concrete steps, request/response, or a proof of
   concept.
3. **Impact** — what an attacker could achieve.

**Response time:** best-effort. We aim to acknowledge within 5 working days
and to keep you updated as we investigate and fix. We will credit reporters
who wish to be named once a fix is live.

## Data Handling

TrustScope processes **public data only** and collects as little as possible:

- **Public repositories only.** Reports are computed from the public GitHub
  REST API and the OpenSSF Scorecard. The production GitHub token is a
  dedicated **read-only, public-repos-only** Personal Access Token — private
  repositories are not fetched and correctly resolve as "not found."
- **Optional sign-in, minimal scope.** Signing in with GitHub (Auth.js /
  NextAuth) happens **only** when a visitor chooses "file as yourself." It
  requests the minimum scope (`read:user public_repo`), keeps the user's access
  token in an encrypted session (JWT), and uses it solely to open the issue the
  user asked for — **as the user, never as a bot**. Every filed issue carries a
  visible "Assessed via TrustScope" attribution. A session cookie is set only
  for signed-in users; anonymous report generation sets no cookie.
- **No third-party analytics, no tracking cookies.**
- **No durable storage of report content.** Reports are cached in-memory for
  fast re-runs only; nothing about a scanned repository is persisted to a
  database or leaves Vercel beyond the public GitHub / Scorecard calls needed
  to build the report.

## Scope

**In scope:** the application source in this repository — its API routes
(`/api/*`), the OAuth flow (`auth.ts`, `/api/auth/*`, `/api/file-issue`), the
Scorecard adapter and its runner, and build/deploy configuration.

**Out of scope:** third-party services TrustScope depends on (the GitHub API,
the OpenSSF Scorecard project, the Vercel platform). Report issues in those to
the respective vendor. Vulnerabilities in *how we integrate* a third party
(e.g. a leaked token, a missing security header, an injection into the
Scorecard runner) are in scope.
