# Phase 3 report

**Date:** 2026-11-05  
**Integration:** `main` (historical draft PR #5 / `phase-3` superseded by `main` @ consolidation; day-to-day work merges to `main`)

## Delivered (engineering)

| Story | Status |
| --- | --- |
| EU-042 Tauri + SQLite StorageAdapter | Full invoke surface; web factory selects SQLite in desktop |
| EU-043 Import web export | `#/desktop-import` first-launch file pick + `importJson` |
| EU-044 Installers CI | `.github/workflows/release.yml` unsigned matrix: Linux deb/rpm/AppImage, universal macOS DMG, Windows x64 MSI/NSIS + ARM64 NSIS, draft checksums; Flatpak via `apps/desktop/flatpak/` stub (not a Tauri target) |
| EU-045 Signing | Conditional on secrets; names in runbook / owner checklist |
| EU-046 Auto-updates | Stub commands + between-session banner; real plugin waits on keys |
| EU-048 Window state | `window.json` restore; practice fullscreen toggle |
| EU-047 Reminders | Unparked for engineering (Could); not built yet |
| EU-049 Matrix + stores | Owner checklist only |
| EU-050 Orient / Welcome design | Orient extracted; stepper + posture/zones/reach; Library replay; axe smoke |
| EU-051 Progress / Library / Settings visuals | HubShell side nav; heatmap + crossover; Settings Keyboard/Learning/Access/Data groups |

## Design fidelity (engineering)

Screens 01–15 composition shells land against `docs/design/` sources. See [FIDELITY-CHECKLIST.md](../design/FIDELITY-CHECKLIST.md). **Signed** column and Playwright PNG baselines for 02–15 wait on product-owner visual pass.

## Phase 2 close-out

- Milestone writers (`first_blind_line`, `all_letters_unlocked`, `crossover_reached`, `first_30_wpm_blind`)
- Phase 2 report marked engineering-complete

## Gate status (do not invent passes)

| Gate | Status |
| --- | --- |
| Gate B (private beta / D1.3–D1.4) | **Open.** Needs 20+ real learners, JSON exports, `pnpm beta-report`. Not claimed from fixtures. |
| Gate C (a11y / metrics) | Engineering axe smoke on funnel routes; owner cohort metrics still required |
| Gate D (keyboard matrix) | Owner hardware only |

## Needs a person

See [docs/phase-3-owner-checklist.md](../phase-3-owner-checklist.md):

- Gate B / Gate C from real exports
- FIDELITY-CHECKLIST Signed column (light/dark/HC/RM)
- Signing secrets, notarization, Authenticode
- Keyboard matrix Gate D; Microsoft Store / Flathub
- Confirm ADR 0001; fill PRIVACY/SECURITY placeholders; second-person runbook test

## Handover (D3.5)

- [x] README status current
- [x] Engineering stop recorded: **no Phase 4 until Gate B decision and desktop owner gates**
- [ ] PRIVACY.md / SECURITY.md placeholders filled by product owner
- [ ] Release runbook tested by a second person
- [ ] CHANGELOG released section for first desktop version

## Explicitly out of scope until gates

- Phase 4 (accounts, classroom, more languages)
- Claiming public web v1 (D2.1) or signed store releases without owner checklist items
