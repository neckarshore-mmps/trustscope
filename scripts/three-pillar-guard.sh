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

# -I skips binary files (PNG OG images live under app/). Case-insensitive.
# Trailing `|| true` keeps a clean "no matches" (grep exit 1) from tripping set -e.
matches="$(grep -rniIE "$PATTERN" app config public 2>/dev/null \
  | grep -vE '^(app/opengraph-image\.alt\.txt|app/twitter-image\.alt\.txt|config/pillars\.test\.ts):' \
  || true)"

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
