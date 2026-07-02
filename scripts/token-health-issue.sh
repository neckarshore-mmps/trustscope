#!/usr/bin/env bash
#
# token-health-issue.sh — GitHub Issue alerting for the daily token-health monitor.
#
# Turns the token-health signal into a VISIBLE, deduplicated repo Issue instead of the silent
# default Actions-failure email (Founder preference). Each concern keeps ONE standing issue,
# keyed by a HIDDEN body marker (an HTML comment) — NOT the label alone — so the health-failure
# issue and the per-token expiry-warning issues never overwrite each other.
#
# Subcommands:
#   open-or-update <marker> <title> <body-file>
#       Ensure exactly one OPEN issue carrying <marker> exists:
#         open one found     -> add a comment (fresh context)
#         recently-closed one-> reopen + comment
#         none               -> create it (label token-health; the marker is embedded automatically)
#   close-if-open <marker> [comment]
#       Close the open issue carrying <marker>, if any (idempotent). Used on a GREEN run.
#   days-until <when>
#       PURE. Print whole days from now until <when> (GNU-date-parseable, e.g. "2026-09-30 00:00:00 UTC").
#       Empty/unparseable input -> no output, exit 1 (caller treats as "unknown -> skip", never a crash).
#   parse-expiry
#       PURE. Read HTTP headers on stdin; print the `github-authentication-token-expiration` value (or nothing).
#   self-test
#       PURE, no network. Exercises days-until + parse-expiry + the 14-day threshold. For local smoke.
#
# Env: GH_TOKEN / GITHUB_TOKEN authenticates the gh subcommands. Repo is inferred by gh (GITHUB_REPOSITORY
# in Actions, or the local remote). Callers pass a body WITHOUT the marker — create embeds it.
#
# Consistency: GitHub's issue LIST endpoints lag a few seconds behind create/close, so dedup assumes
# runs are spaced apart (true for the daily cron — the standing issue is always from a prior run).
# Two runs mutating the same marker within seconds could rarely double-post; the strongly-consistent
# state re-check in open-or-update makes that failure mode a benign duplicate, never a lost alert.

set -uo pipefail

LABEL="token-health"

# ---- portable GNU date (native on the ubuntu runner; gdate via homebrew coreutils for local smoke) ----
_gnu_date() {
  if command -v gdate >/dev/null 2>&1; then gdate "$@"; else date "$@"; fi
}

# days_until <when> -> integer days (may be negative). Empty/unparseable -> exit 1, no output.
days_until() {
  local when="${1:-}"
  [[ -n "$when" ]] || return 1
  local target now
  target=$(_gnu_date -u -d "$when" +%s 2>/dev/null) || return 1
  now=$(_gnu_date -u +%s)
  printf '%s\n' "$(( (target - now) / 86400 ))"
}

# parse_expiry_header: read HTTP headers on stdin, print the expiration value (or nothing).
# HTTP/2 lowercases header names (GitHub API is HTTP/2); match case-insensitively for safety.
parse_expiry_header() {
  awk 'tolower($0) ~ /^github-authentication-token-expiration:/ {
         sub(/^[^:]*:[ \t]*/, ""); gsub(/\r/, ""); print; exit
       }'
}

ensure_label() {
  gh label create "$LABEL" --color ededed --description "Token-health monitor alerts" 2>/dev/null || true
}

# first OPEN issue whose body carries <marker>, else empty.
# Uses the REST list endpoint (primary-consistent — no search-index lag, unlike `gh issue list`);
# REST /issues also returns PRs, so exclude them with `.pull_request | not`.
find_open_issue() {
  local marker="$1"
  gh api "repos/{owner}/{repo}/issues?state=open&labels=$LABEL&per_page=100" \
    --jq "([.[] | select((.pull_request | not) and ((.body // \"\") | contains(\"$marker\")))] | .[0].number) // empty"
}

# most-recently-closed issue whose body carries <marker>, else empty
find_recent_closed_issue() {
  local marker="$1"
  gh api "repos/{owner}/{repo}/issues?state=closed&labels=$LABEL&per_page=100&sort=updated&direction=desc" \
    --jq "([.[] | select((.pull_request | not) and ((.body // \"\") | contains(\"$marker\")))] | sort_by(.closed_at) | .[-1].number) // empty"
}

# strongly-consistent single-issue state read (OPEN/CLOSED). The list endpoints above lag a few
# seconds behind a mutation, so we re-confirm a list hit before acting on it.
_issue_state() {
  gh issue view "$1" --json state --jq .state 2>/dev/null
}

cmd_open_or_update() {
  local marker="${1:?marker}" title="${2:?title}" body_file="${3:?body-file}"
  ensure_label
  # Fail-closed: a failed read / list / state-read / mutation MUST return non-zero, never print
  # "Updated"/"Reopened"/"Created" and exit 0 (that silently drops the alert this monitor exists to
  # raise). `set -e` stays off on purpose — the list helpers return empty-but-success on a no-match —
  # so every fallible step propagates explicitly with `|| return`.
  local body existing existing_state="" closed closed_state=""
  body=$(<"$body_file") || return

  existing=$(find_open_issue "$marker") || return
  if [[ -n "$existing" ]]; then existing_state=$(_issue_state "$existing") || return; fi
  if [[ -n "$existing" && "$existing_state" == "OPEN" ]]; then
    printf '%s\n' "$body" | gh issue comment "$existing" --body-file - || return
    echo "Updated open issue #$existing ($marker)"
    return 0
  fi

  closed=$(find_recent_closed_issue "$marker") || return
  if [[ -n "$closed" ]]; then closed_state=$(_issue_state "$closed") || return; fi
  if [[ -n "$closed" && "$closed_state" == "CLOSED" ]]; then
    gh issue reopen "$closed" >/dev/null || return
    printf '%s\n' "$body" | gh issue comment "$closed" --body-file - || return
    echo "Reopened issue #$closed ($marker)"
    return 0
  fi

  # create — embed the hidden marker so future runs can find THIS issue
  printf '%s\n\n%s\n' "$body" "$marker" | gh issue create --title "$title" --label "$LABEL" --body-file - || return
  echo "Created issue ($marker)"
}

cmd_close_if_open() {
  local marker="${1:?marker}" comment="${2:-}"
  local existing
  existing=$(find_open_issue "$marker") || return
  [[ -n "$existing" ]] || { echo "No open issue for $marker — nothing to close"; return 0; }
  [[ -z "$comment" ]] || gh issue comment "$existing" --body "$comment" >/dev/null || true
  gh issue close "$existing" >/dev/null || return
  echo "Closed issue #$existing ($marker)"
}

cmd_self_test() {
  local fail=0 d
  # far future -> positive, well over the threshold
  d=$(days_until "2999-01-01 00:00:00 UTC") || { echo "FAIL future parse"; fail=1; }
  [[ "${d:-0}" -gt 100 ]] || { echo "FAIL future>100 got '${d:-}'"; fail=1; }
  # past -> negative
  d=$(days_until "2000-01-01 00:00:00 UTC") || { echo "FAIL past parse"; fail=1; }
  [[ "${d:-0}" -lt 0 ]] || { echo "FAIL past<0 got '${d:-}'"; fail=1; }
  # empty + garbage -> exit 1, no output
  if days_until "" >/dev/null 2>&1; then echo "FAIL empty should exit 1"; fail=1; fi
  if days_until "not-a-date" >/dev/null 2>&1; then echo "FAIL garbage should exit 1"; fail=1; fi
  # expiry-lead sanity on days_until: 10 days out sits inside the 14-day warn window, 20 days out clears it
  # (the warn decision itself — days <= 14 — lives in the workflow; here we only sanity-check the day count)
  local ten twenty
  ten=$(days_until "$(_gnu_date -u -d '+10 days' +'%Y-%m-%d %H:%M:%S UTC')")
  twenty=$(days_until "$(_gnu_date -u -d '+20 days' +'%Y-%m-%d %H:%M:%S UTC')")
  [[ "${ten:-99}" -lt 14 ]] || { echo "FAIL 10d<14 got '${ten:-}'"; fail=1; }
  [[ "${twenty:-0}" -ge 14 ]] || { echo "FAIL 20d>=14 got '${twenty:-}'"; fail=1; }
  # parse-expiry: extracts the value, ignores other headers, tolerates a trailing CR
  local sample got
  sample=$'HTTP/2 200\r\nserver: GitHub.com\r\ngithub-authentication-token-expiration: 2026-09-30 00:00:00 UTC\r\nx-foo: bar\r\n'
  got=$(printf '%s' "$sample" | parse_expiry_header)
  [[ "$got" == "2026-09-30 00:00:00 UTC" ]] || { echo "FAIL parse-expiry got '$got'"; fail=1; }
  # parse-expiry: no header -> empty
  got=$(printf 'HTTP/2 200\r\nx-foo: bar\r\n' | parse_expiry_header)
  [[ -z "$got" ]] || { echo "FAIL parse-expiry no-header got '$got'"; fail=1; }

  if [[ "$fail" -eq 0 ]]; then echo "✅ self-test passed"; else echo "❌ self-test FAILED"; return 1; fi
}

main() {
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
    open-or-update) cmd_open_or_update "$@" ;;
    close-if-open)  cmd_close_if_open "$@" ;;
    days-until)     days_until "$@" ;;
    parse-expiry)   parse_expiry_header ;;
    self-test)      cmd_self_test ;;
    *)
      echo "usage: $0 {open-or-update <marker> <title> <body-file> | close-if-open <marker> [comment] | days-until <when> | parse-expiry | self-test}" >&2
      exit 2
      ;;
  esac
}

main "$@"
