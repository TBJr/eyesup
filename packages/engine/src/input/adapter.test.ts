import { describe, expect, it } from 'vitest';
import type { RawKeyEvent } from '../types.js';
import {
  adaptKeyEvent,
  createInputAdapterState,
  handsReady,
  isPeekModifier,
} from './adapter.js';

function ev(partial: Partial<RawKeyEvent> & Pick<RawKeyEvent, 'type' | 'code' | 'key'>): RawKeyEvent {
  return {
    timeStamp: 1,
    repeat: false,
    isComposing: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altGraphKey: false,
    capsLock: false,
    ...partial,
  };
}

describe('input adapter (EU-012, C4)', () => {
  it('drops auto-repeat', () => {
    const r = adaptKeyEvent(
      createInputAdapterState(),
      ev({ type: 'keydown', code: 'KeyA', key: 'a', repeat: true }),
    );
    expect(r.actions.some((a) => a.type === 'ignore' && a.reason === 'repeat')).toBe(
      true,
    );
  });

  it('holds dead keys until a composed character arrives', () => {
    let state = createInputAdapterState();
    let r = adaptKeyEvent(
      state,
      ev({ type: 'keydown', code: 'Digit6', key: 'Dead' }),
    );
    state = r.state;
    expect(state.pendingDeadCode).toBe('Digit6');
    r = adaptKeyEvent(
      state,
      ev({ type: 'keydown', code: 'KeyE', key: 'ê' }),
    );
    expect(r.actions.some((a) => a.type === 'keydown' && a.composed)).toBe(true);
    expect(r.state.pendingDeadCode).toBeUndefined();
  });

  it('peeks on Ctrl alone but not with AltGraph or Alt (C4)', () => {
    expect(
      isPeekModifier(
        ev({ type: 'keydown', code: 'KeyA', key: 'a', ctrlKey: true }),
      ),
    ).toBe(true);
    expect(
      isPeekModifier(
        ev({
          type: 'keydown',
          code: 'KeyA',
          key: 'a',
          ctrlKey: true,
          altKey: true,
        }),
      ),
    ).toBe(false);
    expect(
      isPeekModifier(
        ev({
          type: 'keydown',
          code: 'KeyA',
          key: 'a',
          ctrlKey: true,
          altGraphKey: true,
        }),
      ),
    ).toBe(false);
  });

  it('treats Ctrl+letter as a shortcut, not a scored key', () => {
    const r = adaptKeyEvent(
      createInputAdapterState(),
      ev({ type: 'keydown', code: 'KeyC', key: 'c', ctrlKey: true }),
    );
    expect(r.actions.some((a) => a.type === 'shortcut')).toBe(true);
  });

  it('pauses scoring during IME composition', () => {
    const r = adaptKeyEvent(
      createInputAdapterState(),
      ev({ type: 'keydown', code: 'KeyA', key: 'a', isComposing: true }),
    );
    expect(r.actions.some((a) => a.type === 'notice' && a.notice === 'ime')).toBe(
      true,
    );
  });

  it('detects Caps Lock', () => {
    const r = adaptKeyEvent(
      createInputAdapterState(),
      ev({ type: 'keydown', code: 'KeyA', key: 'A', capsLock: true }),
    );
    expect(
      r.actions.some((a) => a.type === 'notice' && a.notice === 'caps_lock'),
    ).toBe(true);
  });

  it('reports hands-ready when F and J are both down', () => {
    let state = createInputAdapterState();
    state = adaptKeyEvent(
      state,
      ev({ type: 'keydown', code: 'KeyF', key: 'f' }),
    ).state;
    expect(handsReady(state)).toBe(false);
    state = adaptKeyEvent(
      state,
      ev({ type: 'keydown', code: 'KeyJ', key: 'j' }),
    ).state;
    expect(handsReady(state)).toBe(true);
  });

  it('clears peek on Control keyup and ignores non-typing keys', () => {
    let state = createInputAdapterState();
    state = adaptKeyEvent(
      state,
      ev({ type: 'keydown', code: 'ControlLeft', key: 'Control', ctrlKey: true }),
    ).state;
    expect(state.peeking).toBe(true);
    const up = adaptKeyEvent(
      state,
      ev({ type: 'keyup', code: 'ControlLeft', key: 'Control' }),
    );
    expect(up.state.peeking).toBe(false);
    const ignore = adaptKeyEvent(
      createInputAdapterState(),
      ev({ type: 'keydown', code: 'F5', key: 'F5' }),
    );
    expect(ignore.actions.some((a) => a.type === 'ignore')).toBe(true);
  });

  it('scores a normal character keydown', () => {
    const r = adaptKeyEvent(
      createInputAdapterState(),
      ev({ type: 'keydown', code: 'KeyA', key: 'a' }),
    );
    expect(r.actions[0]).toMatchObject({
      type: 'keydown',
      code: 'KeyA',
      key: 'a',
      peeking: false,
    });
  });
});
