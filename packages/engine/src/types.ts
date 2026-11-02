/** Learning track from onboarding placement (§03). */
export type Track = 'foundations' | 'retrain' | 'adaptive' | 'fluency';

/** Generated / scheduled practice line kind (§04 lesson anatomy, C18). */
export type LineKind =
  | 'warmup'
  | 'key_drill'
  | 'pair_drill'
  | 'pseudo_words'
  | 'real_words'
  | 'mixed_review'
  | 'blind_check'
  | 'cool_down';

/** Guide fade level L0–L3 (§02 / C17). */
export type GuideLevel = 0 | 1 | 2 | 3;

/** One line of practice text (§04, C13). */
export interface Line {
  readonly text: string;
  readonly kind: LineKind;
  /** Lowercase focus character for this line. */
  readonly focusChar: string;
}

/** Finger assignment on a physical key (layout format). */
export type Finger =
  | 'L1'
  | 'L2'
  | 'L3'
  | 'L4'
  | 'R1'
  | 'R2'
  | 'R3'
  | 'R4'
  | 'T';

export interface LayoutKey {
  readonly code: string;
  readonly row: number;
  readonly width: number;
  readonly finger: Finger;
  readonly base?: string;
  readonly shift?: string;
  readonly altGr?: string;
  readonly home?: boolean;
  readonly bump?: boolean;
  readonly learn?: boolean;
}

/** Keyboard layout definition (packages/layouts/*.json). */
export interface Layout {
  readonly id: string;
  readonly name: string;
  readonly language: string;
  readonly standard: string;
  readonly fingerprint: Record<string, string>;
  readonly keys: readonly LayoutKey[];
  readonly learnOrder: readonly (readonly string[])[];
  readonly deadKeys?: Record<string, Record<string, string>>;
}

/** Per-key mastery state (§04 mastery model). */
export interface KeyStat {
  readonly code: string;
  accuracy: number;
  timeToTypeMs: number;
  /** Rolling intervals for smoothed median time-to-type. */
  recentIntervalsMs: number[];
  /** Rolling first-attempt correctness (1/0) for fade window (§02 / C17). */
  recentFirstAttempts: number[];
  /** Sessions that have included this key (for L0 hold). */
  sessionsWithKey: number;
  presses: number;
  level: GuideLevel;
  lastPractisedIso: string | undefined;
  stableSessions: number;
}

/** Per pair timing for Chunk-stage drills (§04). */
export interface PairStat {
  readonly pair: string;
  accuracy: number;
  timeToTypeMs: number;
  recentIntervalsMs: number[];
  count: number;
}

/** Learner state snapshot used by the scheduler (§04). */
export interface Learner {
  readonly layoutId: string;
  track: Track;
  targetWpm: number;
  goalWpm: number;
  unlockedGroupCount: number;
  keys: KeyStat[];
  pairs: PairStat[];
  /** 1-based completed session count after a session ends; before first session is 0. */
  sessionCount: number;
  dailyMinutes: 5 | 12 | 20;
}

/**
 * Normalised keyboard event (C3). Produced by the UI bridge from DOM events;
 * engine logic consumes only this shape.
 */
export interface RawKeyEvent {
  readonly type: 'keydown' | 'keyup';
  readonly code: string;
  readonly key: string;
  readonly timeStamp: number;
  readonly repeat: boolean;
  readonly isComposing: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly altGraphKey: boolean;
  readonly capsLock: boolean;
}
