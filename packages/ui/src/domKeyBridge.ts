import type { RawKeyEvent } from '@eyesup/engine';

/**
 * Turn a DOM KeyboardEvent into the engine's RawKeyEvent (C3).
 * Web and desktop share this bridge.
 */
export function toRawKeyEvent(event: KeyboardEvent): RawKeyEvent {
  return {
    type: event.type === 'keyup' ? 'keyup' : 'keydown',
    code: event.code,
    key: event.key,
    timeStamp: event.timeStamp,
    repeat: event.repeat,
    isComposing: event.isComposing,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
    altGraphKey: event.getModifierState('AltGraph'),
    capsLock: event.getModifierState('CapsLock'),
  };
}

/**
 * Inside the typing surface only: prevent Space (scroll), Backspace, ' and /
 * (Firefox quick find). Cmd/Ctrl shortcuts pass through (§06).
 */
export function shouldPreventDefault(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey) {
    return false;
  }
  if (event.key === ' ' || event.code === 'Space') {
    return true;
  }
  if (event.key === 'Backspace' || event.code === 'Backspace') {
    return true;
  }
  if (event.key === "'" || event.key === '/') {
    return true;
  }
  return false;
}
