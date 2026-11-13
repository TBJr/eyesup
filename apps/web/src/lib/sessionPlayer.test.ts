import { describe, expect, it } from 'vitest';
import { createInputAdapterState } from '@eyesup/engine';
import { createLinePlay, handlePracticeKey } from './sessionPlayer.js';

function stampedKey(key: string, code: string, timeStamp: number): KeyboardEvent {
  return {
    type: 'keydown',
    key,
    code,
    timeStamp,
    repeat: false,
    isComposing: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
    getModifierState: () => false,
  } as unknown as KeyboardEvent;
}

describe('handlePracticeKey mastery scores', () => {
  it('emits first-of-line then interval scores for correct keys', () => {
    let line = { ...createLinePlay(), startedAt: 1000 };
    const input = createInputAdapterState();

    const first = handlePracticeKey(stampedKey('a', 'KeyA', 1100), {
      ui: 'typing',
      input,
      line,
      current: { text: 'ab', kind: 'key_drill', focusChar: 'a' },
      track: 'foundations',
      onPreventDefault: false,
    });
    expect(first.scores).toHaveLength(1);
    expect(first.scores[0]).toMatchObject({
      expectedChar: 'a',
      got: 'a',
      correctFirstAttempt: true,
      isFirstKeyOfLine: true,
      peeked: false,
      intervalMs: 0,
    });

    const second = handlePracticeKey(stampedKey('b', 'KeyB', 1250), {
      ui: 'typing',
      input: first.input,
      line: first.line,
      current: { text: 'ab', kind: 'key_drill', focusChar: 'a' },
      track: 'foundations',
      onPreventDefault: false,
    });
    expect(second.scores).toHaveLength(1);
    expect(second.scores[0]).toMatchObject({
      expectedChar: 'b',
      correctFirstAttempt: true,
      isFirstKeyOfLine: false,
      intervalMs: 150,
    });
    expect(second.lineComplete).toBe(true);
  });

  it('marks incorrect foundations presses and keeps caret', () => {
    const result = handlePracticeKey(stampedKey('x', 'KeyX', 50), {
      ui: 'typing',
      input: createInputAdapterState(),
      line: { ...createLinePlay(), startedAt: 1 },
      current: { text: 'a', kind: 'key_drill', focusChar: 'a' },
      track: 'foundations',
      onPreventDefault: false,
    });
    expect(result.scores[0]?.correctFirstAttempt).toBe(false);
    expect(result.line.caret).toBe(0);
    expect(result.line.errors.has(0)).toBe(true);
  });
});
