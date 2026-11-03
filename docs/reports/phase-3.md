# Phase 3 report

**Date:** 2026-11-04  
**Branch:** `phase-3`

## Delivered (engineering)

| Story | Status |
| --- | --- |
| EU-042 Tauri + SQLite StorageAdapter | Full invoke surface; web factory selects SQLite in desktop |
| EU-043 Import web export | `#/desktop-import` first-launch file pick + `importJson` |
| EU-044 Installers CI | `.github/workflows/release.yml` unsigned matrix + draft checksums |
| EU-045 Signing | Conditional on secrets; names in runbook / owner checklist |
| EU-046 Auto-updates | Stub commands + between-session banner; real plugin waits on keys |
| EU-048 Window state | `window.json` restore; practice fullscreen toggle |
| EU-047 Reminders | Deferred (Could) |
| EU-049 Matrix + stores | Owner checklist only |

## Phase 2 close-out on this branch

- Milestone writers (`first_blind_line`, `all_letters_unlocked`, `crossover_reached`, `first_30_wpm_blind`)
- Phase 2 report marked engineering-complete

## Needs a person

See [docs/phase-3-owner-checklist.md](../phase-3-owner-checklist.md):

- Gate B / Gate C from real exports
- Signing secrets, notarization, Authenticode
- Keyboard matrix Gate D; Microsoft Store / Flathub
- Confirm ADR 0001; fill PRIVACY/SECURITY placeholders; second-person runbook test

## Handover (D3.5)

- [x] README status current
- [ ] PRIVACY.md / SECURITY.md placeholders filled by product owner
- [ ] Release runbook tested by a second person
- [ ] CHANGELOG released section for first desktop version
