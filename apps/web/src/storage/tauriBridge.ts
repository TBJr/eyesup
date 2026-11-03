/** Minimal Tauri 2 global bridge (withGlobalTauri) — no @tauri-apps/api dependency. */

type TauriCore = {
  invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
};

type TauriGlobals = {
  core?: TauriCore;
};

declare global {
  interface Window {
    __TAURI__?: TauriGlobals;
  }
}

export function detectIsTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.__TAURI__?.core?.invoke);
}

export async function invokeCmd<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const invoke = window.__TAURI__?.core?.invoke;
  if (!invoke) {
    throw new Error(`Tauri invoke unavailable for command "${cmd}"`);
  }
  return invoke<T>(cmd, args);
}
