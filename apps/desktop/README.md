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

Or from this package:

```bash
pnpm --filter @eyesup/desktop tauri dev
pnpm --filter @eyesup/desktop tauri build
```

## Storage

- Schema: `src-tauri/migrations/0001_init.sql` (includes streak / Commit Week / eyes-up points columns; not yet shipped, so edits stay in place)
- On launch the shell opens `eyesup.sqlite3` under the OS app-data directory and applies the migration when the DB is empty
- Tauri command `import_json` accepts an EyesUpExport JSON payload and replaces learner tables (web → desktop hand-off, EU-043)

A TypeScript `StorageAdapter` that invokes these commands is not wired into `App.svelte` yet; the web app still uses IndexedDB.

## Icons

Generate bundle icons before a release build:

```bash
pnpm --filter @eyesup/desktop tauri icon path/to/app-icon-1024.png
```

Placeholder files under `src-tauri/icons/` are enough for local `tauri dev` once present.

## Privacy

No analytics, no remote logging. CSP allows only the app origin. Keystrokes are read only while the EyesUp window has focus.
