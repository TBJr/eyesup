# EyesUp desktop (Tauri 2)

Thin native shell that loads the `apps/web` build and keeps learner data in SQLite on the device (EU-042).

## Requirements

- Node.js 22 LTS and pnpm 9+ (see repo root)
- Rust toolchain ([rustup](https://rustup.rs/)) with a recent stable (1.77+)
- Platform webview deps (WebView2 on Windows; Xcode CLT on macOS; WebKitGTK on Linux — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

## Scripts

From the repo root:

```bash
pnpm install
pnpm desktop:dev          # Vite + Tauri window (devUrl → localhost:5173)
pnpm build:desktop        # production web build, then tauri build
```

If the desktop window is empty or stuck on “Loading…”, confirm Vite is serving on port 5173 (Tauri’s `devUrl`). Open `http://localhost:5173/#/welcome` in a browser to check the web shell independently.

Or from this package:

```bash
pnpm --filter @eyesup/desktop tauri dev
pnpm --filter @eyesup/desktop tauri build
```

## Storage

- Schema: `src-tauri/migrations/0001_init.sql` (includes streak / Commit Week / eyes-up points columns; not yet shipped, so edits stay in place)
- On launch the shell opens `eyesup.sqlite3` under the OS app-data directory and applies the migration when the DB is empty
- Full `StorageAdapter` parity is wired: Rust commands in `sqlite_adapter.rs`, TypeScript bridge in `apps/web/src/storage/tauriSqliteAdapter.ts` via `window.__TAURI__.core.invoke` (`withGlobalTauri: true`)
- `createStorageAdapter()` in the web app selects Tauri/SQLite inside the desktop shell and IndexedDB in the browser
- `import_json` / `export_json` move EyesUpExport payloads for web ↔ desktop hand-off (EU-043); `delete_everything` clears learner tables

## Window state (EU-048)

- Geometry is stored in `window.json` next to `eyesup.sqlite3` in the app data dir: `{ x, y, width, height, fullscreen }`
- Restored on launch; saved on move/resize (debounced) and on close
- Practice UI calls `set_fullscreen` for the full-screen toggle

## Updates (EU-046)

Unsigned milestone: stub commands `check_for_update` / `apply_update` return `updates require signing secrets`. The web shell still has the between-session banner path. Enable the real Tauri updater when CI secrets exist — see [docs/desktop-updater.md](../../docs/desktop-updater.md).

## Release builds (EU-044)

- Workflow: [`.github/workflows/release.yml`](../../.github/workflows/release.yml) on `v*` tags or `workflow_dispatch`
- Jobs: same checks as CI → matrix Tauri build (Ubuntu 22.04 `.deb`/`.rpm`/AppImage, macOS DMG, Windows MSI/NSIS) via `tauri-apps/tauri-action@v0` → draft GitHub release with SHA-256 checksums
- Signing and updater artifacts stay skipped until `TAURI_SIGNING_PRIVATE_KEY` (and related secrets) are present — [docs/release-runbook.md](../../docs/release-runbook.md)

## Icons

Generate bundle icons before a release build:

```bash
pnpm --filter @eyesup/desktop tauri icon path/to/app-icon-1024.png
```

Placeholder files under `src-tauri/icons/` are enough for local `tauri dev` once present.

## Privacy

No analytics, no remote logging. CSP allows only the app origin. Keystrokes are read only while the EyesUp window has focus.
