/** Four Orient nav phases (design 06 header: Step n of 4). */
export const ORIENT_NAV_COUNT = 4;

/** Home-row drill spanning Bumps + Finger zones (design “6 presses”). */
export const ORIENT_DRILL_CODES = [
  'KeyF',
  'KeyJ',
  'KeyD',
  'KeyK',
  'KeyS',
  'KeyL',
] as const;

/** Try-it reaches after the drill. */
export const ORIENT_TRY_CODES = ['KeyE', 'KeyR', 'KeyO'] as const;

export type OrientNavPhase = 0 | 1 | 2 | 3;

export type OrientState = {
  /** 0 Sit · 1 Bumps · 2 Zones · 3 Try */
  navPhase: OrientNavPhase;
  /** Sit: Space has been pressed. */
  sitReady: boolean;
  /** Count of completed drill keys (0–6). */
  drillDone: number;
  /** Count of completed try keys (0–3). */
  tryDone: number;
};

export function createOrientState(): OrientState {
  return { navPhase: 0, sitReady: false, drillDone: 0, tryDone: 0 };
}

export function expectedOrientCode(state: OrientState): string | undefined {
  if (state.navPhase === 0) return state.sitReady ? undefined : 'Space';
  if (state.navPhase === 1 || state.navPhase === 2) {
    if (state.drillDone >= ORIENT_DRILL_CODES.length) return undefined;
    return ORIENT_DRILL_CODES[state.drillDone];
  }
  if (state.navPhase === 3) {
    if (state.tryDone >= ORIENT_TRY_CODES.length) return undefined;
    return ORIENT_TRY_CODES[state.tryDone];
  }
  return undefined;
}

export function drillProgress(state: OrientState): {
  current: number;
  total: number;
  doneCodes: readonly string[];
} {
  const total = ORIENT_DRILL_CODES.length;
  const done = Math.min(state.drillDone, total);
  return {
    current: Math.min(done + 1, total),
    total,
    doneCodes: ORIENT_DRILL_CODES.slice(0, done),
  };
}

export function tryProgress(state: OrientState): {
  current: number;
  total: number;
  doneCodes: readonly string[];
} {
  const total = ORIENT_TRY_CODES.length;
  const done = Math.min(state.tryDone, total);
  return {
    current: Math.min(done + 1, total),
    total,
    doneCodes: ORIENT_TRY_CODES.slice(0, done),
  };
}

export function canGoNext(state: OrientState): boolean {
  if (state.navPhase === 0) return state.sitReady;
  if (state.navPhase === 1) return state.drillDone >= 2;
  if (state.navPhase === 2) return state.drillDone >= ORIENT_DRILL_CODES.length;
  return false;
}

export type OrientKeyResult =
  | { kind: 'noop' }
  | { kind: 'state'; state: OrientState }
  | { kind: 'done' };

/** Apply a physical key code; wrong keys are ignored. */
export function advanceOrientKey(state: OrientState, code: string): OrientKeyResult {
  const expected = expectedOrientCode(state);
  if (!expected || code !== expected) return { kind: 'noop' };

  if (state.navPhase === 0) {
    return { kind: 'state', state: { ...state, sitReady: true } };
  }

  if (state.navPhase === 1 || state.navPhase === 2) {
    const drillDone = state.drillDone + 1;
    let navPhase = state.navPhase;
    // After F+J, move into Finger zones automatically.
    if (navPhase === 1 && drillDone >= 2) navPhase = 2;
    return { kind: 'state', state: { ...state, drillDone, navPhase } };
  }

  if (state.navPhase === 3) {
    const tryDone = state.tryDone + 1;
    if (tryDone >= ORIENT_TRY_CODES.length) return { kind: 'done' };
    return { kind: 'state', state: { ...state, tryDone } };
  }

  return { kind: 'noop' };
}

/** Footer Next / Enter when unlocked. */
export function goNext(state: OrientState): OrientKeyResult {
  if (!canGoNext(state)) return { kind: 'noop' };
  if (state.navPhase === 0) {
    return { kind: 'state', state: { ...state, navPhase: 1 } };
  }
  if (state.navPhase === 1) {
    return { kind: 'state', state: { ...state, navPhase: 2 } };
  }
  if (state.navPhase === 2) {
    return { kind: 'state', state: { ...state, navPhase: 3, tryDone: 0 } };
  }
  return { kind: 'noop' };
}

export function goBack(state: OrientState): OrientState {
  if (state.navPhase <= 0) return state;
  const navPhase = (state.navPhase - 1) as OrientNavPhase;
  return { ...state, navPhase };
}

/** Glyph shown on the turn-panel key chip. */
export function orientKeyGlyph(code: string): string {
  if (code === 'Space') return 'Space';
  if (code === 'Semicolon') return ';';
  if (code.startsWith('Key') && code.length === 4) return code.slice(3);
  return code;
}

/** CSS custom property for the finger that owns a home/reach key. */
export function orientFingerVar(code: string): string {
  switch (code) {
    case 'KeyF':
    case 'KeyJ':
    case 'KeyR':
      return 'var(--color-finger-index, #e69f00)';
    case 'KeyD':
    case 'KeyK':
    case 'KeyE':
      return 'var(--color-finger-middle, #56b4e9)';
    case 'KeyS':
    case 'KeyL':
    case 'KeyO':
      return 'var(--color-finger-ring, #009e73)';
    case 'KeyA':
    case 'Semicolon':
      return 'var(--color-finger-little, #cc79a7)';
    default:
      return 'var(--color-finger-thumb, #8a8f98)';
  }
}
