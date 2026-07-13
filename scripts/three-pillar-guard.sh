#!/usr/bin/env bash
# Three-pillar guard — fails if a user-facing "four pillar" / "four-pillar" string
# leaks into any surface a user can read.
#
# The free TrustScope product is THREE pillars everywhere in user-facing copy:
# Security & Supply Chain · Trust & Governance · Community & Sustainability.
# Functional Quality (Pillar 4) is Pro-only — kept in the internal data model,
# absent from every free surface. See DECISIONS.md → TS-FQ-PRO-ONLY-THREE-PILLARS.
#
# This gate exists because the three-pillar move (#80) shipped but silently left
# "four-pillar" claims scattered across surfaces the original scan never covered
# (README, SECURITY.md, the GitHub description, and /changelog). A grep-gate turns
# that recurring manual sweep into an automatic invariant.
#
# Deliberate exceptions (not scanned):
#   - config/pillars.test.ts       internal 4-pillar DATA MODEL test (not user-facing)
#   - CHANGELOG.md archival body    the SemVer sections ABOVE '## [public]' are release
#                                   history (v0.1.0 shipped four pillars); only the [public]
#                                   section — the part /changelog renders — is scanned.
#   NOTE: the GitHub repo *description* is not in the repo, so it cannot be guarded here —
#   keep it three-pillar by hand (checked at release).
#
# The OG/Twitter assets (app/opengraph-image.* + twitter-image.* + alt.txt) were regenerated to
# three-pillar (2026-07-12, T-TS-OG-IMAGE-THREE-PILLAR done) and are no longer excluded — the alt
# text is now actively guarded against a four-pillar regression. To regenerate all served assets
# (both PNGs + the SVG master copy) from the SVG, follow the full sequence in assets/README.md.
#
# Scanned surfaces — every place a user can actually READ our copy:
#   - app/ config/ public/     the app, its data, and served assets
#   - README.md SECURITY.md    repo front doors (browsed directly on GitHub)
#   - CHANGELOG.md [public]     the ONLY CHANGELOG section /changelog renders live (parsed at
#                               build time); the archival SemVer sections above it keep real
#                               history — v0.1.0 genuinely shipped four pillars — and stay out of scope.
set -euo pipefail

cd "$(dirname "$0")/.."

PATTERN='four[ -]pillar'
EXCLUDE='^(config/pillars\.test\.ts):'

# Scan the user-facing directories + the two repo front-door docs. grep exit codes:
# 0 = match, 1 = no match, >1 = a real error (missing/unreadable path). We must fail
# CLOSED on the last case rather than mistaking a broken scan for a clean tree — so
# capture grep's own exit code (not the pipeline's) and do NOT swallow stderr. -I skips
# binary (PNG OG images live under app/).
set +e
raw="$(grep -rniIE "$PATTERN" app config public README.md SECURITY.md)"
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

# CHANGELOG.md — scan ONLY the [public] section (from the '## [public]' marker to EOF).
# That section is the curated end-user copy the /changelog page renders live at build time,
# so a "four-pillar" string here is a real user-facing leak. The archival SemVer sections
# ABOVE the marker are release history (v0.1.0 shipped four pillars) and are intentionally
# not scanned.
pub_matches="$(awk '/^## \[public\]/{f=1} f' CHANGELOG.md | grep -niIE "$PATTERN" || true)"
if [ -n "$pub_matches" ]; then
  echo "❌ Three-pillar guard failed — 'four pillar' string(s) in the CHANGELOG [public] section"
  echo "   (rendered live on /changelog):"
  echo ""
  echo "$pub_matches"
  echo ""
  echo "Reword the curated highlight to three pillars. The archival SemVer sections above"
  echo "'## [public]' keep real history and are not scanned."
  exit 1
fi

echo "✅ Three-pillar guard passed — no user-facing four-pillar leaks in app/, config/, public/, README.md, SECURITY.md, or the CHANGELOG [public] section."
