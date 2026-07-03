# GITHUB_AUTH_TOKEN — rotation runbook & health monitoring

`GITHUB_AUTH_TOKEN` powers the on-demand Scorecard run + the GitHub-API calls. It **must be a
classic PAT** with `public_repo` scope — fine-grained / OAuth / App tokens cannot read classic
branch protection and break the `Branch-Protection` check (see issue #10). When it expires or is
revoked, on-demand reports fail with a 401 ("Couldn't generate the report").

> Note: with the `execScorecard` recovery (#11) a *branch-protection-only* failure no longer breaks
> the whole report — but a fully **expired/revoked** token 401s before any check runs (empty stdout,
> nothing to recover), so rotation is still required.

## Monitoring (automated early-warning)

- Workflow: `.github/workflows/token-health.yml` — daily (`06:37 UTC`) + `workflow_dispatch`.
- Script: `scripts/token-health-check.sh` — renders an on-demand report on production and fails if it
  401s / doesn't render. It rotates through on-demand (fast-path-404) repos by weekday so each is hit
  ~weekly, well after its 24 h cache expired — guaranteeing a real on-demand run that exercises the token.
- **Alert channel:** a failed run triggers GitHub's default Actions failure notifications (email to
  repo watchers / admins) and a red mark in the Actions tab.

### 👤 OWNER — confirm cadence + channel

- **Cadence:** daily is the default. Adjust the `cron` in `token-health.yml` if you want more/less.
- **Channel:** GitHub's default email/UI is on with no setup. If you want push alerts (Slack/Discord/
  email-to-a-list), add a notify step — otherwise no action needed.
- **Optional:** set a calendar reminder for the PAT's own expiry date (the health-check catches
  expiry *reactively*; a reminder lets you rotate *before* an outage).

## Rotation procedure (when expiring / expired / compromised)

1. **Create a new classic PAT:** GitHub → Settings → Developer settings → **Personal access tokens
   (classic)** → Generate new token (classic). Scope: **`public_repo`** only. Expiration: your choice
   (set a reminder if finite).
2. **Set it in Vercel — Production *and* Preview** (both run on-demand). Dashboard:
   Project **trustscope → Settings → Environment Variables** → edit `GITHUB_AUTH_TOKEN` → paste →
   ensure both **Production** and **Preview** are checked → Save. (CLI works for Production;
   Preview requires a git-branch prompt — the dashboard is simplest for both.)
3. **Redeploy production** so the new value is picked up (env changes apply on the next deploy).
4. **Verify (R2):** run the health-check manually — Actions → **Token Health (daily)** →
   **Run workflow** → green. Or `curl -I` an on-demand repo report and confirm it renders.
5. **Revoke the old token** on GitHub.

## Scope reference

`public_repo` is sufficient — verified 2026-07-02: a `public_repo`-scoped classic PAT reads
`Branch-Protection` for arbitrary public repos we don't administer (e.g. `facebook/react`). Do **not**
use a fine-grained token here.
