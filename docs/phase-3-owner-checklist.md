# Phase 3 product-owner checklist (EU-045 / EU-049 / gates)

Engineering can ship unsigned desktop builds and wiring. The items below need a person with accounts, hardware and store access. Do not put secret values in the repo — names only.

## Gate B / Gate C (beta)

Follow [beta-checklist.md](beta-checklist.md):

- [ ] Invite the private beta cohort and collect JSON exports
- [ ] Run `pnpm beta-report path/to/exports` and record Gate B (`gate_b_pass_half_cohort`)
- [ ] Use the same exports for Gate C day-30 / eyes-up supporting metrics printed by the report
- [ ] Decide Gate B / Gate C pass or remediation before treating Phase 3 as learner-ready

## Signing secrets (names only)

Add these to the GitHub Actions secret store when ready to sign (see [release-runbook.md](release-runbook.md)):

| Secret name | Used for |
| --- | --- |
| `APPLE_CERTIFICATE` | macOS Developer ID certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Certificate import password |
| `APPLE_ID` | Notarization Apple ID |
| `APPLE_TEAM_ID` | Apple Team ID |
| `APPLE_APP_PASSWORD` | App-specific password for notarization |
| `AZURE_SIGNING_*` | Windows Authenticode (cloud signing) |
| `GPG_PRIVATE_KEY` | Linux package / repo signatures |
| `GPG_PASSPHRASE` | GPG key passphrase |
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri updater minisign private key |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Updater key password (if set) |

Release workflow signing steps stay skipped while `TAURI_SIGNING_PRIVATE_KEY` is empty. Enable the real updater per [desktop-updater.md](desktop-updater.md).

## Keyboard matrix — Gate D

- [ ] Run every applicable cell in [keyboard-test-matrix.md](keyboard-test-matrix.md) on real hardware
- [ ] Cover Windows (WebView2), macOS (WKWebView), Ubuntu, and at least one of Fedora / Kali as listed in the matrix
- [ ] Record pass/fail and any WebKitGTK workarounds
- [ ] Latency: keystroke-to-paint under 16 ms at the 95th percentile on the reference laptop (NFR-01)

## Store submissions

- [ ] Microsoft Store listing and package submission (signed MSI/MSIX as required)
- [ ] Flathub update or first submission pull request
- [ ] Confirm installers from the draft GitHub release match store builds

## Confirm ADR 0001

- [ ] After Gate D matrix results, confirm or revise [adr/0001-desktop-shell-tauri.md](adr/0001-desktop-shell-tauri.md) (Tauri 2 vs Electron fallback)
- [ ] If any OS fails with no workaround, stop and decide the Electron fallback before marketing “desktop done”

## Handover notes for engineering

List anything still blocked (secrets, cohort dates, store accounts) in `docs/agent/PROGRESS.md` under **Waiting on the product owner**.
