import { describe, expect, it } from 'vitest';
import { shouldPreventDefault, toRawKeyEvent } from './domKeyBridge.js';

function fakeKey(
  partial: Partial<KeyboardEvent> & Pick<KeyboardEvent, 'type' | 'code' | 'key'>,
): KeyboardEvent {
  return {
    type: partial.type,
    code: partial.code,
    key: partial.key,
    timeStamp: partial.timeStamp ?? 1,
    repeat: partial.repeat ?? false,
    isComposing: partial.isComposing ?? false,
    altKey: partial.altKey ?? false,
    ctrlKey: partial.ctrlKey ?? false,
    metaKey: partial.metaKey ?? false,
    shiftKey: partial.shiftKey ?? false,
    getModifierState: (name: string) => {
      if (name === 'AltGraph') return Boolean(partial.getModifierState?.('AltGraph'));
      if (name === 'CapsLock') return Boolean(partial.getModifierState?.('CapsLock'));
      return false;
    },
  } as KeyboardEvent;
}

describe('domKeyBridge', () => {
  it('maps DOM events to RawKeyEvent', () => {
    const raw = toRawKeyEvent(
      fakeKey({ type: 'keydown', code: 'KeyA', key: 'a', ctrlKey: true }),
    );
    expect(raw.code).toBe('KeyA');
    expect(raw.ctrlKey).toBe(true);
    expect(raw.type).toBe('keydown');
  });

  it('prevents Space and Backspace but not Ctrl shortcuts', () => {
    expect(
      shouldPreventDefault(fakeKey({ type: 'keydown', code: 'Space', key: ' ' })),
    ).toBe(true);
    expect(
      shouldPreventDefault(
        fakeKey({ type: 'keydown', code: 'KeyC', key: 'c', ctrlKey: true }),
      ),
    ).toBe(false);
  });
});
