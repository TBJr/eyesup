# 0001. Use Tauri 2 as the desktop shell, with Electron as the fallback

- **Status:** Proposed (confirm at Gate D, after the keyboard test matrix runs on all three OSes)
- **Date:** 2026-10-24
- **Decided by:** Product owner and lead developer

## Context

EyesUp must ship native apps for Windows, macOS and the major Linux families from the same code as the web app. The desktop app adds offline use from first launch, local SQLite storage, signed auto-updates and OS notifications. Installers should be small, because many learners download on slow or metered connections.

The riskiest part of a typing tutor is keyboard input. Tauri renders with each OS's own web view: WebView2 (Chromium) on Windows, WKWebView (WebKit) on macOS and WebKitGTK on Linux. Keyboard events therefore come from three engines, not one.

## Decision

Build the desktop apps with Tauri 2, loading the same interface build as the web app. Keep everything platform-specific inside `apps/desktop` so the shell can be replaced.

## Alternatives considered

| Option | For | Against |
| --- | --- | --- |
| Tauri 2 | Small installers; Rust core; signed updater; Linux packages (deb, rpm, AppImage, Flatpak) built by the CLI | Three different web engines; WebKitGTK input behaviour must be proven |
| Electron | Same Chromium on every OS, so one input behaviour | Much larger installers and memory use |
| Flutter | One rendering engine everywhere | A second interface codebase, separate from the web app |
| Native app per OS | Best platform fit | Three codebases for a small team |

## Consequences

- The interface must be tested in WebKit from the start, not only in Chrome (Playwright's WebKit engine plus real Macs and Linux machines).
- The Phase 0 keyboard test page runs on all three OSes before any desktop work is planned in detail.
- Fallback rule: if dead keys, AltGr or layout detection fail on WebKitGTK and cannot be worked around, ship that platform (or all) on Electron. Because the interface is a plain web build and the engine never touches the DOM, the swap is limited to `apps/desktop`: storage adapter, updater and packaging, roughly 1–2 weeks.

## Revisit when

Any row of the keyboard test matrix fails on a desktop web view with no workaround, or keystroke-to-paint latency on the reference Linux laptop exceeds 16 ms at the 95th percentile.
