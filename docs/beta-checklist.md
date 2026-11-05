# Private beta checklist (D1.3 / D1.4 · Gate B)

Engineering prep for the Phase 1 private beta. Product-owner steps need a person; developer steps can run in CI or locally.

## Deploy (product owner)

1. Enable GitHub Pages for this repository (Settings → Pages → GitHub Actions).
2. Confirm the latest `pages` workflow on `main` succeeded.
3. Open `https://<owner>.github.io/<repo>/app/` and complete Welcome → Orient → one short session offline (DevTools → Offline).
4. Confirm `https://<owner>.github.io/<repo>/keyboard-test/` loads.

## Cohort (product owner)

1. Invite at least 20 learners; share the `/app/` URL and a short brief (practice daily if possible; no account).
2. After about two weeks, ask each learner to export JSON from Settings and send the file (no typed text is required beyond what the export already omits for practice lines).
3. Put all exports in one folder and run:

```bash
pnpm beta-report path/to/exports
```

4. Gate B passes when `gate_b_pass_half_cohort: YES` (home-row keys at ≥95% accuracy and guide level ≥2 for at least half the cohort).

## Hardware checks (product owner / QA)

1. Run [keyboard-test-matrix.md](keyboard-test-matrix.md) rows that apply on Windows, macOS and Linux with real keyboards.
2. On a mid-range reference laptop (~2018 class), confirm keystroke-to-paint under 16 ms at the 95th percentile (NFR-01), using the latency harness on the keyboard test page or `pnpm test:e2e` latency spec plus a manual spot check.

## Engineering verification (developer)

Synthetic exports under `fixtures/beta-exports/` exercise the report script without learner data:

```bash
pnpm beta-report fixtures/beta-exports
```

The script must never print typed text or keystroke logs.

## After Gate B

Record the go/no-go decision in `docs/agent/PROGRESS.md`. On a go, continue engineering on short-lived feature branches from `main` (see `CONTRIBUTING.md`). Do not start Phase 4 until the product owner says so.
