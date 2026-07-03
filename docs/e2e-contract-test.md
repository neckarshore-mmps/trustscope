# Nightly E2E Scorecard-contract test (issue #12)

Guards the recovery path in `lib/adapters/scorecard-adapter.ts::execScorecard`: it asserts the
**pinned** `scorecard` binary still emits a full JSON report on stdout **even when it exits
non-zero** because a check hard-errors. Unit tests cover the recovery *logic* (via the injectable
`execFileFn`); this covers the *external contract* — a scorecard version bump that stopped emitting
JSON on non-zero exit would silently break production recovery, and only this test would catch it.

- Workflow: `.github/workflows/e2e-scorecard-contract.yml` — nightly (`03:17 UTC`) + manual
  `workflow_dispatch`. Not a per-PR gate (slow, needs secrets, tests an external tool).
- Script: `scripts/e2e-scorecard-contract.sh` — runs `./bin/scorecard` against a fixed repo with
  each token and asserts the two cases below. **Skips cleanly (exit 0) when the secrets are absent.**

## What it asserts

| Case | Token | Expected |
|------|-------|----------|
| A | classic PAT (`public_repo`) | scorecard **exit 0**, `Branch-Protection` **scored** (≥ 0) |
| B | fine-grained PAT (public-repo read, **no** `Administration`) | full **JSON on stdout** with a `.checks` array **regardless of exit code** — the recovery contract |

Reference behavior measured 2026-07-02 (scorecard 5.5.0 / dataset image v5.1.1): Case B produced
`exit 1` + valid JSON with `Branch-Protection: score -1`.

## 👤 OWNER — one-time setup: two repo secrets

The test only runs once both secrets exist; until then it self-skips (green).

### 1. Create the two tokens

- **`E2E_CLASSIC_PAT`** — GitHub → Settings → Developer settings → **Personal access tokens
  (classic)** → Generate. Scope: **`public_repo`** only. (This is the "works" state.)
- **`E2E_FINEGRAINED_PAT`** — GitHub → **Fine-grained tokens** → Generate. Repository access:
  **Public Repositories (read-only)** — it must *reach* public repos but have **no**
  `Administration` permission (so it *cannot* read branch protection → triggers the non-zero exit).
  (This is the "fails the check" state that exercises recovery.)

> Use short-ish expirations and rotate; both are low-privilege but real credentials.

### 2. Add them as repository secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**, for each:

| Name | Value |
|------|-------|
| `E2E_CLASSIC_PAT` | the classic PAT (`ghp_…`) |
| `E2E_FINEGRAINED_PAT` | the fine-grained PAT (`github_pat_…`) |

Or via CLI (paste-free is not possible here; the value is read from stdin):

```bash
gh secret set E2E_CLASSIC_PAT --repo neckarshore-mmps/trustscope
gh secret set E2E_FINEGRAINED_PAT --repo neckarshore-mmps/trustscope
```

### 3. Verify

Trigger it manually: Actions → **E2E Scorecard Contract (nightly)** → **Run workflow**. Green =
contract holds. If Case B ever fails with *"NO valid JSON on stdout"*, a scorecard version bump has
broken the recovery premise — investigate before shipping the next `scorecard` version bump.
