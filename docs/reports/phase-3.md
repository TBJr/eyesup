# Phase 3 report (scaffold)

**Date:** 2026-11-03  
**Branch:** `phase-2` (desktop lives alongside Phase 2 until a dedicated `phase-3` branch after Gate C)

## Delivered

| Story | Status |
| --- | --- |
| EU-042 Tauri shell + SQLite | Scaffold: `apps/desktop` Tauri 2, migration, `import_json` command |
| EU-043 Import web export | Rust `import_json` command implemented; wire from UI on first launch still needed |
| EU-044 Installers | `tauri.conf.json` `bundle.targets = "all"`; CI jobs not yet added |
| EU-045 Signing | Documented secret names in release runbook; no secrets in repo |
| EU-046 Auto-updates | Not wired (needs signing keys + updater plugin) |
| EU-047 Reminders | Not started (Could) |
| EU-048 Window state | Default window size in conf; persistence not started (Should) |
| EU-049 Matrix + stores | Owner/QA + store accounts |

## Tooling

- `pnpm desktop:dev` / `pnpm build:desktop`
- `node scripts/version-set.mjs X.Y.Z` (runbook)

## Needs a person

- Apple Developer Program, Windows signing, GPG, Tauri signing key pairs in CI secrets
- Microsoft Store and Flathub submissions
- Full keyboard matrix Gate D on Windows, macOS, Ubuntu, Kali, Fedora
- Confirm ADR 0001 after matrix

## Handover (D3.5) checklist

- [ ] README status current
- [ ] PRIVACY.md / SECURITY.md placeholders filled by product owner
- [ ] Release runbook tested by a second person
- [ ] CHANGELOG released section for first desktop version
