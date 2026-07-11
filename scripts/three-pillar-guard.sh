#!/usr/bin/env bash
# Three-pillar guard — fails if a user-facing "four pillar" / "four-pillar" string
# leaks into app/, config/, or public/.
#
# The free TrustScope product is THREE pillars everywhere in user-facing copy:
# Security & Supply Chain · Trust & Governance · Community & Sustainability.
# Functional Quality (Pillar 4) is Pro-only — kept in the internal data model,
# absent from every free surface. See DECISIONS.md → TS-FQ-PRO-ONLY-THREE-PILLARS.
#
# This gate exists because the three-pillar move (#80) shipped but silently left
# a "four-pillar" claim in public/llms.txt — a live AI/GEO surface. A grep-gate
# turns that manual sweep into an automatic invariant.
#
# Deliberate, Founder-gated exceptions (excluded below, each a tracked backlog item):
#   - CHANGELOG.md                 versioned release history; retroactive-edit is a Founder call (T-TS-CHANGELOG-FOUR-PILLAR)
#   - app/opengraph-image.alt.txt  static OG asset — design regen pending          (T-TS-OG-IMAGE-THREE-PILLAR)
#   - app/twitter-image.alt.txt    static OG asset — design regen pending          (T-TS-OG-IMAGE-THREE-PILLAR)
#   - config/pillars.test.ts       internal 4-pillar DATA MODEL test (not user-facing)
#
# CHANGELOG.md is out of scope by directory (only app/ config/ public/ are scanned).
set -euo pipefail

cd "$(dirname "$0")/.."

PATTERN='four[ -]pillar'
EXCLUDE='^(app/opengraph-image\.alt\.txt|app/twitter-image\.alt\.txt|config/pillars\.test\.ts):'

# Scan the user-facing directories. grep exit codes: 0 = match, 1 = no match,
# >1 = a real error (missing/unreadable path). We must fail CLOSED on the last
# case rather than mistaking a broken scan for a clean tree — so capture grep's
# own exit code (not the pipeline's) and do NOT swallow stderr. -I skips binary
# (PNG OG images live under app/).
set +e
raw="$(grep -rniIE "$PATTERN" app config public)"
rc=$?
set -e

if [ "$rc" -gt 1 ]; then
  echo "❌ Three-pillar guard: scan failed (grep exit $rc) — a target path is"
  echo "   missing or unreadable. Failing closed rather than reporting a clean tree."
  exit 1
fi

# rc is 0 (had matches) or 1 (none). Only when there were matches do we filter
# out the deliberate, documented exceptions.
matches=""
if [ "$rc" -eq 0 ]; then
  matches="$(printf '%s\n' "$raw" | grep -vE "$EXCLUDE" || true)"
fi

if [ -n "$matches" ]; then
  echo "❌ Three-pillar guard failed — user-facing 'four pillar' string(s) found:"
  echo ""
  echo "$matches"
  echo ""
  echo "The free product is three pillars (Functional Quality is Pro-only)."
  echo "If this is a deliberate, Founder-gated exception, add the path to the"
  echo "exclude list in scripts/three-pillar-guard.sh with a one-line reason."
  exit 1
fi

echo "✅ Three-pillar guard passed — no user-facing four-pillar leaks in app/, config/, public/."
