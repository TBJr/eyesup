import type { RawKeyEvent } from '../types.js';
import type {
  AdaptedKeyAction,
  InputAdapterResult,
  InputAdapterState,
} from './types.js';

export function createInputAdapterState(): InputAdapterState {
  return {
    pendingDeadCode: undefined,
    peeking: false,
    keysDown: new Set(),
  };
}

function withKeysDown(
  state: InputAdapterState,
  code: string,
  down: boolean,
): InputAdapterState {
  const next = new Set(state.keysDown);
  if (down) {
    next.add(code);
  } else {
    next.delete(code);
  }
  return { ...state, keysDown: next };
}

/**
 * Ctrl alone starts peek; never while AltGraph or Alt is also down (C4).
 * Ctrl/Cmd + another key is a shortcut.
 */
export function isPeekModifier(event: RawKeyEvent): boolean {
  if (event.altGraphKey || event.altKey) {
    return false;
  }
  return event.ctrlKey && !event.metaKey;
}

export function isModifierOnlyCode(code: string): boolean {
  return (
    code === 'ControlLeft' ||
    code === 'ControlRight' ||
    code === 'AltLeft' ||
    code === 'AltRight' ||
    code === 'ShiftLeft' ||
    code === 'ShiftRight' ||
    code === 'MetaLeft' ||
    code === 'MetaRight' ||
    code === 'CapsLock'
  );
}

/**
 * Pure input adapter (§06 table + C3 + C4). No DOM.
 */
export function adaptKeyEvent(
  state: InputAdapterState,
  event: RawKeyEvent,
): InputAdapterResult {
  const actions: AdaptedKeyAction[] = [];

  if (event.type === 'keyup') {
    let next = withKeysDown(state, event.code, false);
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
      next = { ...next, peeking: false };
    }
    actions.push({
      type: 'keyup',
      code: event.code,
      key: event.key,
      timeStamp: event.timeStamp,
    });
    return { state: next, actions };
  }

  // keydown
  let next = withKeysDown(state, event.code, true);

  if (event.capsLock) {
    actions.push({ type: 'notice', notice: 'caps_lock' });
  }

  if (event.repeat) {
    actions.push({ type: 'ignore', reason: 'repeat' });
    return { state: next, actions };
  }

  if (event.isComposing) {
    actions.push({ type: 'notice', notice: 'ime' });
    actions.push({ type: 'ignore', reason: 'composing' });
    return { state: next, actions };
  }

  const ctrlOrMeta = event.ctrlKey || event.metaKey;
  const peeking = isPeekModifier(event);
  next = { ...next, peeking };

  if (ctrlOrMeta && !isModifierOnlyCode(event.code)) {
    // Ctrl/Cmd + another key: pass through as shortcut (K05, K09); never peek-score
    actions.push({
      type: 'shortcut',
      code: event.code,
      key: event.key,
      timeStamp: event.timeStamp,
    });
    return { state: { ...next, peeking: false }, actions };
  }

  if (isModifierOnlyCode(event.code)) {
    return { state: next, actions };
  }

  if (event.key === 'Dead') {
    next = { ...next, pendingDeadCode: event.code };
    actions.push({ type: 'ignore', reason: 'dead_pending' });
    return { state: next, actions };
  }

  const composed = next.pendingDeadCode !== undefined;
  if (composed) {
    next = { ...next, pendingDeadCode: undefined };
  }

  if (event.key.length !== 1 && event.key !== 'Backspace' && event.key !== 'Enter' && event.key !== 'Escape' && event.key !== 'Tab') {
    actions.push({ type: 'ignore', reason: 'non_typing' });
    return { state: next, actions };
  }

  actions.push({
    type: 'keydown',
    code: event.code,
    key: event.key,
    timeStamp: event.timeStamp,
    peeking,
    composed,
  });
  return { state: next, actions };
}

/** Hands-ready: F and J pressed together (K18). */
export function handsReady(state: InputAdapterState): boolean {
  return state.keysDown.has('KeyF') && state.keysDown.has('KeyJ');
}
