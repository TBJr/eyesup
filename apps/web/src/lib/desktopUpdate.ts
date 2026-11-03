/**
 * Desktop auto-update bridge (EU-046).
 * Polls the Tauri stub (or real updater later); never interrupts a practice session —
 * the caller only shows UI between sessions.
 */

import { detectIsTauri, invokeCmd } from '../storage/tauriBridge.js';

export type DesktopUpdateCheck = {
  available: boolean;
  message: string;
};

const POLL_MS = 5 * 60 * 1000;

export async function checkDesktopUpdate(): Promise<DesktopUpdateCheck> {
  return invokeCmd<DesktopUpdateCheck>('check_for_update');
}

export async function applyDesktopUpdate(): Promise<void> {
  await invokeCmd<void>('apply_update');
}

/**
 * Poll for a desktop update and invoke `onReady` when one is available.
 * Returns a disposer. No-op outside the Tauri shell.
 */
export function startDesktopUpdateWatcher(onReady: () => void): () => void {
  if (!detectIsTauri()) {
    return () => {};
  }

  let cancelled = false;

  const tick = async () => {
    try {
      const result = await checkDesktopUpdate();
      if (!cancelled && result.available) {
        onReady();
      }
    } catch {
      // Stub or missing command — leave web SW updates alone.
    }
  };

  void tick();
  const id = window.setInterval(() => {
    void tick();
  }, POLL_MS);

  return () => {
    cancelled = true;
    window.clearInterval(id);
  };
}
