/**
 * Constructive fix text — single-sourced from the Estate Supply-Chain Hardening Standard §3
 * (neckarshore-planning `docs/plans/2026-07-01-estate-supply-chain-hardening-standard.md`).
 *
 * Per work-order §4c: phrased as a constructive suggestion to the UPSTREAM maintainer, not an
 * internal directive. Do NOT fork the wording — when §3 changes, update it here. The UI presents
 * these under a "constructive suggestions" framing (the reputation mechanism, work-order §2).
 */
export const FIX_TEXT: Record<string, string> = {
  "Token-Permissions":
    "Add a top-level least-privilege `permissions:` block to each workflow file " +
    "(`contents: read`, with per-job write scopes only where needed). Scorecard reads the " +
    "workflow file itself, not the org default setting.",
  "Pinned-Dependencies":
    "SHA-pin every `uses:` Action to a full commit SHA (with a version comment), then let " +
    "Dependabot keep the pins current.",
  "Dependency-Update-Tool":
    "Add `.github/dependabot.yml` — the `github-actions` ecosystem always, plus `npm`/etc. " +
    "wherever a manifest exists.",
  SAST:
    "Add a CodeQL workflow for the repository's real languages (build-mode `none`). Use " +
    "`languages:` (plural) on `codeql-action/init` — `language:` is silently ignored — and " +
    "job-scope `security-events: write`. Private repositories need GitHub Advanced Security.",
  "Security-Policy":
    "Add a `SECURITY.md` (in-repo, or inherited from an org `.github` repository) with an " +
    "explicit private-disclosure channel, a contact (link or email), and supported versions.",
  "Branch-Protection":
    "Add a branch-protection rule: require a pull request, a required status check, and " +
    "dismiss-stale reviews. (Private repositories need a paid GitHub plan for branch protection.)",
  "Code-Review":
    "Require review before merge. Solo projects can satisfy this with an automated reviewer " +
    "(e.g. CodeRabbit) instead of blocking human approval.",
  License:
    "Add a `LICENSE` file with an SPDX-identified license so adopters know their rights.",
  Vulnerabilities:
    "Enable CI dependency-vulnerability scanning (an `npm audit` gate plus Dependabot) and " +
    "triage the open advisories.",
};
