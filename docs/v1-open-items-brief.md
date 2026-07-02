# TrustScope V1 — Open-Items Brief (für /goal)

> Arbeits-Briefing zum Abarbeiten der 5 offenen V1-Punkte aus der Session 2026-07-02.
> Leitprinzip: **maximale Automatisierung** — alles ohne Owner-Wissen Erzeugbare wird erzeugt;
> der Owner ergänzt am Ende nur Informationen (Secrets, Cadence, Ja/Nein), baut nichts selbst.

## Repo & Safety (nicht verhandelbar)

- Working dir (pinnen, JEDER Bash-Cmd startet mit `cd <dir> &&`):
  `~/Developer/projects/neckarshore-mmps/trustscope`
- Erststart: `cd <dir> && git fetch && git status && git log --oneline -5`.
- Pro Punkt ein eigener Branch + PR gegen `main`, Commit-/PR-Konventionen des Repos folgen.
- **KEIN Merge, KEIN Prod-Deploy und KEIN Prod/Preview-Env-Change ohne explizite Owner-Freigabe.**
  Alles nur vorbereiten (Branch + PR), nicht ausführen.
- **R2:** jede „ist erledigt"-Aussage gegen die Realität prüfen — `git log origin/<branch>`,
  `curl -I`, `gh run list`, `vercel ls/inspect`. Snapshot ≠ Jetzt.
- **Keine Secrets** in Code, Logs, Commits oder Chat — nur Platzhalter + Setz-Anleitung.
- Tests/Lint/Build (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`) müssen pro
  Punkt grün bleiben. Fix-Loop-Regel: nach 3 erfolglosen Versuchen stoppen + analysieren.

## Kontext zuerst rehydrieren (frische Session, kein Gedächtnis an den Chat)

Lesen, bevor du irgendetwas änderst:
- GitHub Issue #10 (geschlossen) — die 2 Root Causes des Report-Bugs.
- PR #11 (gemergt) — `execScorecard`-Recovery, live in commit `64a376b`.
- GitHub Issue #12 — offener Backlog-Punkt: nightly E2E-Contract-Test (Referenz-Verhalten drin).
- `README.md` (§ Open User-Actions), `DECISIONS.md`.
- Work-Order (nur READ, nicht editieren):
  `~/Developer/projects/neckarshore-ai/neckarshore-planning/docs/plans/2026-07-01-trustscope-v1-linus-build-workorder.md`

Bereits erledigt (NICHT wiederholen): Prod-Token = classic PAT (`public_repo`) in Production+Preview;
Preview-Env-Vars (`GITHUB_AUTH_TOKEN`, `SCORECARD_RUNNER/ONDEMAND/BIN`) gesetzt + verifiziert.

## Die 5 Punkte

Für jeden Punkt gilt: (a) alles Automatisierbare selbst tun, (b) Owner-Input-Teile vollständig
vorbereiten und im PR mit **„👤 OWNER: …"** markieren, (c) committen + PR öffnen (nicht mergen).

### 1) #4 Scorecard-Run-Host formal abnehmen — [VOLL AUTOMATISIERBAR]

- Betriebs-Envelope des on-demand **binary**-Runners messen: 3–5 on-demand-Runs gegen Prod mit
  **nicht-Dataset-Public-Repos** (fast-path muss 404en, damit der binary-Runner greift). Erfassen:
  Wall-Clock, Vercel-Function-Dauer vs. Timeout (Default 300s), Cold-Start — via `vercel inspect`
  bzw. Function-Logs. Kosten grob einordnen.
- Ergebnis als kurzen Mess-Report unter `docs/` ablegen. `README` §Open-Actions #4 auf ✅ mit Beleg.
- Work-Order/Planning-Repo **nicht** editieren → Findings in den Session-Report für MASCHIN.
- **DoD:** Report vorhanden, README #4 = ✅, Beleg-Zahlen dokumentiert.
- 👤 OWNER: nur falls Timeout/Cold-Start real grenzwertig → Entscheidung Sandbox vs. Fluid-Compute;
  sonst kein Input.

### 2) Issue #12 — nightly E2E-Contract-Test — [AUTO bis auf 2 Secrets]

- Kompletten **GitHub-Actions-Workflow** (scheduled/nightly, NICHT per-PR) + Test-Skript bauen:
  scorecard real (Docker) für beide Token-Zustände fahren und asserten, dass die Recovery greift.
- Verifiziertes Referenz-Verhalten (aus Session 2026-07-02):
  - classic PAT (`public_repo`) → scorecard **exit 0**, Branch-Protection **gescored**.
  - fine-grained PAT (kein `Administration`) → **exit ≠ 0** + **volles JSON auf stdout**
    (Branch-Protection `score: -1`) → Recovery muss `/report` trotzdem rendern lassen (HTTP 200).
- Secret-Platzhalter: `E2E_CLASSIC_PAT`, `E2E_FINEGRAINED_PAT`. Workflow so bauen, dass er **ohne**
  gesetzte Secrets sauber **skippt** (kein rotes CI).
- **DoD:** Workflow + Skript + Doku im PR; skippt ohne Secrets; Schritt-für-Schritt-Anleitung
  zum Anlegen der 2 Secrets beiliegend.
- 👤 OWNER: die 2 Actions-Secrets frisch erstellen + in Repo-Settings hinterlegen.

### 3) Doc-Hygiene (README-Status) — [VOLL AUTOMATISIERBAR]

- `README` §Open User-Actions: #2 (Domain+TLS — live verifiziert, HTTP/2 200 auf der Custom-Domain)
  und #4 (Scorecard-Host) auf ✅ mit Realitäts-Beleg. Veraltete Notizen („Linus adds domain to the
  Vercel project…", „the one open infra fork") korrigieren. Konsistenz mit `DECISIONS.md` prüfen.
- Work-Order-Korrekturen → Session-Report für MASCHIN (nicht selbst editieren).
- **DoD:** README spiegelt Realität; keine widersprüchlichen Status mehr.
- 👤 OWNER: keiner.

### 4) Token-Lifecycle-Monitoring — [AUTOMATISIERBAR, Cadence bestätigen]

- Token-Ablauf ist nicht auslesbar (encrypted). Deshalb **indirekter Wächter**: scheduled
  Healthcheck, der `/report` für ein on-demand-Repo prüft und alarmiert, wenn es zu 401/Fehler
  kippt (Ablauf-Frühwarnung). Plus knappes **Rotations-Runbook** mit genauen Stellen: neuen
  `public_repo`-classic-PAT anlegen → `vercel env` für Production+Preview → redeploy.
- **DoD:** Healthcheck-Mechanismus + Runbook im PR; ohne Owner-Input lauffähig (Cadence als Default).
- 👤 OWNER: gewünschte Prüf-Cadence + Alert-Kanal bestätigen; optional Kalender-Reminder aufs
  PAT-Ablaufdatum.

### 5) Preview-OAuth (Issue-Filing) — [VORBEREITEN, Creds = Owner-Input]

- Niedrig-prio (auf Preview greift by design der Copy-Markdown-Fallback). Nur vorbereiten:
  dokumentieren, welche OAuth-App-Callback-URL(s) + Preview-Env-Vars (`GITHUB_CLIENT_ID/SECRET`,
  `AUTH_SECRET`) nötig wären, mit exakter Setz-Anleitung.
- **DoD:** Doku + Env-Var-Namen + Anleitung im PR.
- 👤 OWNER: entscheiden, ob Preview-OAuth überhaupt gewünscht ist; falls ja, Creds anlegen + in
  Preview-Env setzen (vorbereitete Anleitung nutzen).

## Arbeitsweise & Abschluss

- Reihenfolge: **3 → 1 → 2 → 4 → 5** (schnellste/risikoärmste zuerst).
- Nach jedem Punkt: Tests/Lint/Build grün, committen, PR öffnen (NICHT mergen).
- Abschluss-Deliverable:
  1. Übersicht pro Punkt — Status **✅ fertig** / **🟡 wartet auf 👤 OWNER**, offene PRs verlinkt.
  2. EINE gebündelte **👤 OWNER-Restliste** mit exakt den Werten, die noch einzutragen sind
     (2 Secrets · Monitoring-Cadence + Alert-Kanal · Preview-OAuth Ja/Nein).
  3. Session-Report mit den **MASCHIN-Findings** (Work-Order- + DECISIONS-Updates).
