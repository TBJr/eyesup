import { createIndexedDbAdapter } from './indexedDbAdapter.js';
import { detectIsTauri } from './tauriBridge.js';
import { createTauriSqliteAdapter } from './tauriSqliteAdapter.js';
import type { StorageAdapter } from './types.js';

/** Prefer SQLite via Tauri when running inside the desktop shell; IndexedDB on the web. */
export function createStorageAdapter(): StorageAdapter {
  if (detectIsTauri()) {
    return createTauriSqliteAdapter();
  }
  return createIndexedDbAdapter();
}
