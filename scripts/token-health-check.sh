#!/usr/bin/env bash
#
# Token health-check — an INDIRECT early-warning for GITHUB_AUTH_TOKEN expiry/revocation.
#
# The token value lives encrypted in Vercel and is not readable, so we can't inspect its expiry
# directly. Instead we exercise the on-demand path end-to-end: a revoked/expired token makes the
# on-demand Scorecard run fail with a 401 ("Couldn't generate the report"), while a healthy token
# renders a full four-pillar report. This job renders that signal and fails (→ GitHub notifies) when
# the token has stopped working. See docs/token-rotation-runbook.md.
#
# To actually exercise the token (not the fast-path, which needs no token, and not the 24h cache),
# it rotates through a list of on-demand (fast-path-404) public repos by day-of-week, so each repo is
# hit ~weekly — long after its 24h cache has expired — guaranteeing a fresh on-demand run.
#
# Optional env: TRUSTSCOPE_BASE (default https://trustscope.neckarshore.ai)

set -uo pipefail

BASE="${TRUSTSCOPE_BASE:-https://trustscope.neckarshore.ai}"

# On-demand (fast-path-404), public, stable repos — one per weekday index (1=Mon..7=Sun).
REPOS=(
  "octocat/git-consortium"
  "octocat/octocat.github.io"
  "kelseyhightower/nocode"
  "rubygems/bundler-site"
  "octocat/Spoon-Knife"
  "neckarshore-mmps/trustscope"
  "octocat/git-consortium"
)
REPO="${REPOS[$(( $(date -u +%u) - 1 ))]}"
URL="$BASE/report?repo=$REPO"

echo "Token health-check → $URL"
body=$(curl -s --max-time 300 "$URL")
http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 300 "$URL")

# Healthy = a rendered report (pillar sections). Failure markers = token/auth/generation problems.
if grep -qE "Bad credentials|Couldn.t generate the report|Couldn.t run the Scorecard" <<<"$body"; then
  echo "::error::On-demand report FAILED for $REPO — GITHUB_AUTH_TOKEN is likely expired/revoked. Rotate it: docs/token-rotation-runbook.md"
  exit 1
fi
if [[ "$http" != "200" ]] || ! grep -qE "Security &amp; Supply|Trust &amp; Governance" <<<"$body"; then
  echo "::error::On-demand report did not render for $REPO (http=$http). Investigate — token, deploy, or runner. See docs/token-rotation-runbook.md"
  exit 1
fi

echo "✅ Token healthy — on-demand report rendered for $REPO (http=$http)."
