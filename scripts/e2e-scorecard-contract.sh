#!/usr/bin/env bash
#
# E2E contract test for the Scorecard recovery path (lib/adapters/scorecard-adapter.ts::execScorecard).
#
# It exercises the EXTERNAL contract the recovery depends on, which unit tests cannot: that the
# *pinned* scorecard binary still emits a full JSON report on stdout EVEN WHEN it exits non-zero
# because a check hard-errors (e.g. Branch-Protection can't be read by a fine-grained token).
# A future scorecard version bump that breaks this would silently break production recovery — this
# test is the regression guard. See issue #12.
#
# Runs the pinned ./bin/scorecard (same binary as prod) against a fixed repo with two token states:
#   A) classic PAT       -> expect exit 0 AND Branch-Protection scored (>= 0)
#   B) fine-grained PAT  -> expect a full JSON report on stdout regardless of exit code (the contract)
#
# Skips cleanly (exit 0) when the two secrets are absent, so nightly stays green on forks / unset envs.
#
# Required env: E2E_CLASSIC_PAT, E2E_FINEGRAINED_PAT
# Optional env: E2E_REPO (default neckarshore-mmps/trustscope — 404s the fast-path, has real branch
#               protection), SCORECARD_BIN (default ./bin/scorecard)

set -uo pipefail

REPO="${E2E_REPO:-neckarshore-mmps/trustscope}"
BIN="${SCORECARD_BIN:-./bin/scorecard}"

if [[ -z "${E2E_CLASSIC_PAT:-}" || -z "${E2E_FINEGRAINED_PAT:-}" ]]; then
  echo "::notice::E2E_CLASSIC_PAT / E2E_FINEGRAINED_PAT not set — skipping Scorecard contract test."
  exit 0
fi

if [[ ! -x "$BIN" ]]; then
  echo "::error::scorecard binary not found/executable at '$BIN' (run: npm run fetch:scorecard)"
  exit 1
fi

has_json_checks() { jq -e '.checks | type == "array"' >/dev/null 2>&1 <<<"$1"; }
fail=0

echo "== Case A: classic PAT -> exit 0, Branch-Protection scored (repo: $REPO) =="
outA=$(GITHUB_AUTH_TOKEN="$E2E_CLASSIC_PAT" "$BIN" --repo="github.com/$REPO" --format=json 2>/tmp/a.err)
codeA=$?
scoreA=$(jq -r '.checks[]? | select(.name=="Branch-Protection") | .score' <<<"$outA" 2>/dev/null)
echo "   exit=$codeA  branch-protection score=${scoreA:-<none>}"
[[ "$codeA" -eq 0 ]] || { echo "::error::classic PAT expected exit 0, got $codeA"; sed -n '$p' /tmp/a.err; fail=1; }
has_json_checks "$outA" || { echo "::error::classic run produced no valid JSON on stdout"; fail=1; }
[[ -n "$scoreA" && "$scoreA" != "-1" ]] || { echo "::error::classic PAT: Branch-Protection not readable (score='${scoreA:-<none>}') — is the token a classic PAT with public_repo?"; fail=1; }

echo "== Case B: fine-grained PAT -> full JSON on stdout regardless of exit (the recovery contract) =="
outB=$(GITHUB_AUTH_TOKEN="$E2E_FINEGRAINED_PAT" "$BIN" --repo="github.com/$REPO" --format=json 2>/tmp/b.err)
codeB=$?
echo "   exit=$codeB"
if [[ "$codeB" -eq 0 ]]; then
  echo "::warning::fine-grained PAT returned exit 0 — it may have gained branch-protection read; the non-zero-exit contract was not exercised this run."
fi
if has_json_checks "$outB"; then
  scoreB=$(jq -r '.checks[]? | select(.name=="Branch-Protection") | .score' <<<"$outB" 2>/dev/null)
  echo "   CONTRACT OK: valid JSON with .checks present despite exit=$codeB (branch-protection score=${scoreB:-<none>})"
else
  echo "::error::CONTRACT BROKEN: scorecard exited $codeB with NO valid JSON on stdout — execScorecard recovery would fail. Likely causes: a scorecard version bump changed the behavior, OR the fine-grained token cannot even reach the public repo (needs public-repo read)."
  sed -n '$p' /tmp/b.err
  fail=1
fi

if [[ "$fail" -eq 0 ]]; then echo "== ✅ Scorecard recovery contract holds =="; else echo "== ❌ contract test failed =="; fi
exit "$fail"
