# Phase 1 report

**Date:** 2026-11-03  
**Branch at close:** `main` (PR #2 merged); follow-on hardening on `phase-2`

## Delivered

| ID | Result |
| --- | --- |
| D1.1 Onboarding | Welcome, Orient, six questions, probes A/B, placement, result card |
| D1.2 Practice engine | Scheduler, fade L0–L3, peek, pause, line results, summary, break card |
| D1.3 Web MVP | IndexedDB, export/delete, PWA service worker, Pages `/app/` workflow |
| D1.4 Beta report | `pnpm beta-report`; fixtures under `fixtures/beta-exports/` |

## Checks (Phase 1 close-out log)

typecheck, lint, test (~92% engine coverage), build, size (~100 KB gzipped), e2e Chromium/WebKit.

## Still needs a person

- Enable/confirm GitHub Pages; invite 20 beta learners ([docs/beta-checklist.md](../beta-checklist.md))
- Keyboard matrix on real hardware
- NFR-01 reference-laptop latency sign-off
- Gate B go/no-go from `pnpm beta-report` on real exports

## Engineering note

Synthetic Gate B fixtures pass the report script (≥50% home-row ready). Real cohort evidence is required before treating Gate B as accepted in product terms. Phase 2 engineering proceeds on `phase-2` per finish roadmap.
