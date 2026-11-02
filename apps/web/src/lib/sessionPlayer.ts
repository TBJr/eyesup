import {
  adaptKeyEvent,
  createInputAdapterState,
  handsReady,
  type InputAdapterState,
  type Line,
  type Track,
} from '@eyesup/engine';
import { shouldPreventDefault, toRawKeyEvent } from '@eyesup/ui/domKeyBridge';

export type SessionUiState =
  | 'handsReady'
  | 'typing'
  | 'paused'
  | 'lineResult'
  | 'unlockCard'
  | 'breakCard'
  | 'summary';

export interface LinePlayState {
  caret: number;
  errors: Set<number>;
  marked: Set<number>;
  correctFirst: number;
  totalKeys: number;
  startedAt: number;
  activeMs: number;
  lastDown: number | undefined;
  peeks: number;
}

export function createLinePlay(): LinePlayState {
  return {
    caret: 0,
    errors: new Set(),
    marked: new Set(),
    correctFirst: 0,
    totalKeys: 0,
    startedAt: 0,
    activeMs: 0,
    lastDown: undefined,
    peeks: 0,
  };
}

export interface KeyHandlerResult {
  input: InputAdapterState;
  line: LinePlayState;
  ui: SessionUiState;
  lineComplete: boolean;
  notices: string[];
}

export function handlePracticeKey(
  event: KeyboardEvent,
  options: {
    ui: SessionUiState;
    input: InputAdapterState;
    line: LinePlayState;
    current: Line;
    track: Track;
    onPreventDefault?: boolean;
  },
): KeyHandlerResult {
  if (options.onPreventDefault !== false && shouldPreventDefault(event)) {
    event.preventDefault();
  }

  const notices: string[] = [];
  let ui = options.ui;
  let input = options.input;
  let line = { ...options.line, errors: new Set(options.line.errors), marked: new Set(options.line.marked) };
  let lineComplete = false;

  if (ui === 'handsReady') {
    const raw = toRawKeyEvent(event);
    const adapted = adaptKeyEvent(input, raw);
    input = adapted.state;
    if (handsReady(input)) {
      ui = 'typing';
      line = { ...createLinePlay(), startedAt: performance.now() };
    }
    return { input, line, ui, lineComplete, notices };
  }

  if (event.key === 'Escape' && (ui === 'typing' || ui === 'paused')) {
    event.preventDefault();
    ui = ui === 'typing' ? 'paused' : 'typing';
    return { input, line, ui, lineComplete, notices };
  }

  if (ui === 'paused') {
    return { input, line, ui, lineComplete, notices };
  }

  if (ui !== 'typing') {
    return { input, line, ui, lineComplete, notices };
  }

  const raw = toRawKeyEvent(event);
  const adapted = adaptKeyEvent(input, raw);
  input = adapted.state;

  for (const action of adapted.actions) {
    if (action.type === 'notice') {
      notices.push(action.notice);
      continue;
    }
    if (action.type !== 'keydown') continue;
    if (action.key === 'Escape' || action.key === 'Enter' || action.key === 'Tab') continue;
    if (action.key === 'Backspace') continue;

    if (action.peeking) {
      line = { ...line, peeks: line.peeks + 1 };
    }

    const expected = options.current.text[line.caret] ?? '';
    const got = action.key;
    line.totalKeys += 1;

    const now = action.timeStamp;
    if (line.lastDown !== undefined && line.startedAt > 0) {
      // active time counted by caller via rAF / blur; keep lastDown
    }
    line.lastDown = now;

    if (got === expected) {
      line.correctFirst += 1;
      line.caret += 1;
      if (line.caret >= options.current.text.length) {
        lineComplete = true;
        ui = 'lineResult';
      }
    } else if (options.track === 'foundations') {
      line.errors.add(line.caret);
      // stop-on-error: do not advance
    } else {
      line.marked.add(line.caret);
      line.caret += 1;
      if (line.caret >= options.current.text.length) {
        lineComplete = true;
        ui = 'lineResult';
      }
    }
  }

  return { input, line, ui, lineComplete, notices };
}

export function createFreshInput(): InputAdapterState {
  return createInputAdapterState();
}
