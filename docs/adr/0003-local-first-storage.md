# 0003. Store everything on the device; no backend in the learning loop

- **Status:** Accepted
- **Date:** 2026-10-24
- **Decided by:** Product owner

## Context

EyesUp records per-key timing and accuracy to adapt practice. Typing rhythm can identify a person, and own-text practice can contain private writing. Many learners will be offline or on slow connections. There are no accounts until Phase 4.

## Decision

All learner data lives on the device: IndexedDB in the web app, SQLite in the desktop app, behind one storage interface with the same record types. Nothing typed, no keystroke timing and no saved text is sent anywhere. Any future analytics are opt-in and session-level only.

## Alternatives considered

| Option | For | Against |
| --- | --- | --- |
| Local-first (chosen) | Private by design; works offline; no server to run or secure | No sync across devices until accounts exist |
| Cloud database from day 1 | Sync and cross-device progress | Accounts, consent flows, hosting cost and a breach target, all before the method is proven |
| localStorage | Simplest | Size limits and no structure for per-key history |

## Consequences

- Settings offers a full JSON export and import; this is also how progress moves from the web app to the desktop app.
- Every record type has a schema version so later migrations (and eventual sync) can upgrade old data.
- The desktop app's SQLite schema starts at `apps/desktop/src-tauri/migrations/0001_init.sql`.
- When accounts arrive, sync must be end-to-end encrypted and opt-in, and this ADR is superseded by a new one.

## Revisit when

Learners repeatedly ask for progress on more than one device, or Phase 4 begins.
