import {
  confidence,
  createKeyStat,
  createPairStat,
  effectiveUnlockGroupCount,
  endSessionFadeUpdate,
  eyesUpPoints,
  recordKeyPress,
  recordPairPress,
  targetMsPerChar,
  TARGET_WPM_FOUNDATIONS_START,
  type GuideLevel,
  type KeyStat,
  type Layout,
  type PairStat,
  type Track,
} from '@eyesup/engine';
import type { KeyStatRecord, PairStatRecord } from '../storage/types.js';
import type { KeystrokeScoreEvent } from './sessionPlayer.js';

/** Map a stored key row to an engine KeyStat. */
export function keyStatFromRecord(record: KeyStatRecord): KeyStat {
  return {
    code: record.code,
    accuracy: record.accuracy,
    timeToTypeMs: record.timeToTypeMs ?? targetMsPerChar(TARGET_WPM_FOUNDATIONS_START),
    recentIntervalsMs: [...record.recentIntervalsMs],
    recentFirstAttempts: [...record.recentFirstAttempts],
    sessionsWithKey: record.sessionsWithKey,
    presses: record.presses,
    level: record.guideLevel,
    lastPractisedIso: record.lastPractised ?? undefined,
    stableSessions: record.stableSessions,
  };
}

/** Map a stored pair row to an engine PairStat. */
export function pairStatFromRecord(record: PairStatRecord): PairStat {
  const base = createPairStat(record.pair);
  return {
    ...base,
    accuracy: record.accuracy,
    timeToTypeMs: record.timeMs ?? base.timeToTypeMs,
    count: record.count,
  };
}

function keyIsUnlocked(record: KeyStatRecord | undefined): boolean {
  if (!record) return false;
  return record.unlockedAt != null || record.presses > 0;
}

/**
 * Count consecutive learn-order groups where every code is unlocked
 * (has unlockedAt or presses > 0). Minimum 1.
 */
export function countConsecutiveUnlockedGroups(
  layout: Layout,
  keyStats: readonly KeyStatRecord[],
): number {
  const byCode = new Map(keyStats.map((k) => [k.code, k]));
  let count = 0;
  for (const group of layout.learnOrder) {
    const allUnlocked = group.every((code) => keyIsUnlocked(byCode.get(code)));
    if (!allUnlocked) break;
    count += 1;
  }
  return Math.max(1, count);
}

/**
 * Unlock group count for the scheduler / generator.
 * Fluency: all groups. Retrain: physical via effectiveUnlockGroupCount.
 */
export function unlockedGroupCountForTrack(
  layout: Layout,
  keyStats: readonly KeyStatRecord[],
  track: Track,
): number {
  if (track === 'fluency') {
    return layout.learnOrder.length;
  }
  const consecutive = countConsecutiveUnlockedGroups(layout, keyStats);
  if (track === 'retrain') {
    return effectiveUnlockGroupCount(layout.learnOrder.length, consecutive, 'retrain');
  }
  return consecutive;
}

/**
 * Build engine key/pair lists for a session, seeding missing unlocked codes.
 */
export function buildSessionKeysAndPairs(
  layout: Layout,
  keyRecords: readonly KeyStatRecord[],
  pairRecords: readonly PairStatRecord[],
  unlockedGroupCount: number,
): { keys: KeyStat[]; pairs: PairStat[]; levels: Record<string, number> } {
  const byCode = new Map(keyRecords.map((r) => [r.code, keyStatFromRecord(r)]));
  const codes =
    unlockedGroupCount >= layout.learnOrder.length
      ? layout.learnOrder.flat()
      : layout.learnOrder.slice(0, unlockedGroupCount).flat();

  const keys: KeyStat[] = [];
  const levels: Record<string, number> = {};
  for (const code of codes) {
    const existing = byCode.get(code) ?? createKeyStat(code);
    keys.push(existing);
    levels[code] = existing.level;
  }

  const pairs = pairRecords.map(pairStatFromRecord);
  return { keys, pairs, levels };
}

/** Resolve a typed character to a physical key code for the layout. */
export function codeForChar(layout: Layout, ch: string): string | null {
  if (ch === ' ') return 'Space';
  const lower = ch.toLowerCase();
  const hit = layout.keys.find(
    (k) => k.base?.toLowerCase() === lower || k.shift?.toLowerCase() === lower,
  );
  return hit?.code ?? null;
}

export function keyStatToRecord(
  layoutId: string,
  stat: KeyStat,
  targetWpm: number,
  unlockedAt: string | null,
): KeyStatRecord {
  return {
    schemaVersion: 1,
    layoutId,
    code: stat.code,
    unlockedAt,
    guideLevel: stat.level,
    accuracy: stat.accuracy,
    timeToTypeMs: stat.timeToTypeMs,
    confidence: confidence(stat.accuracy, stat.timeToTypeMs, targetWpm),
    presses: stat.presses,
    stableSessions: stat.stableSessions,
    sessionsWithKey: stat.sessionsWithKey,
    recentIntervalsMs: [...stat.recentIntervalsMs],
    recentFirstAttempts: [...stat.recentFirstAttempts],
    lastPractised: stat.lastPractisedIso ?? null,
  };
}

export function pairStatToRecord(layoutId: string, pair: PairStat): PairStatRecord {
  return {
    schemaVersion: 1,
    layoutId,
    pair: pair.pair,
    timeMs: pair.timeToTypeMs,
    accuracy: pair.accuracy,
    count: pair.count,
  };
}

export interface MasteryApplyState {
  keys: Map<string, KeyStatRecord>;
  pairs: Map<string, PairStatRecord>;
  levels: Record<string, number>;
  /** Last expected non-space character for digraph pair stats. */
  lastExpectedChar: string | null;
  practisedCodes: Set<string>;
  /** Codes that only saw peeked presses this session (for fade). */
  peekedOnlyCodes: Set<string>;
  /** Codes that saw at least one non-peek press. */
  nonPeekCodes: Set<string>;
  eyesUpDelta: number;
  guideChanges: Array<{ code: string; from: number; to: number }>;
  errorsByKey: Record<string, number>;
}

export function createMasteryApplyState(
  keyRecords: readonly KeyStatRecord[],
  pairRecords: readonly PairStatRecord[],
  levels: Record<string, number>,
): MasteryApplyState {
  return {
    keys: new Map(keyRecords.map((k) => [k.code, k])),
    pairs: new Map(pairRecords.map((p) => [p.pair, p])),
    levels: { ...levels },
    lastExpectedChar: null,
    practisedCodes: new Set(),
    peekedOnlyCodes: new Set(),
    nonPeekCodes: new Set(),
    eyesUpDelta: 0,
    guideChanges: [],
    errorsByKey: {},
  };
}

/**
 * Apply scored keystrokes to in-memory key/pair records (EU-013 / EU-018).
 */
export function applyKeystrokeScores(
  state: MasteryApplyState,
  options: {
    layout: Layout;
    layoutId: string;
    targetWpm: number;
    nowIso: string;
    scores: readonly KeystrokeScoreEvent[];
  },
): MasteryApplyState {
  const next: MasteryApplyState = {
    keys: new Map(state.keys),
    pairs: new Map(state.pairs),
    levels: { ...state.levels },
    lastExpectedChar: state.lastExpectedChar,
    practisedCodes: new Set(state.practisedCodes),
    peekedOnlyCodes: new Set(state.peekedOnlyCodes),
    nonPeekCodes: new Set(state.nonPeekCodes),
    eyesUpDelta: state.eyesUpDelta,
    guideChanges: [...state.guideChanges],
    errorsByKey: { ...state.errorsByKey },
  };

  for (const score of options.scores) {
    const code = codeForChar(options.layout, score.expectedChar);
    if (!code || score.expectedChar === ' ') {
      if (score.expectedChar === ' ') {
        next.lastExpectedChar = null;
      }
      continue;
    }

    const existing = next.keys.get(code);
    const beforeLevel = existing?.guideLevel ?? next.levels[code] ?? 0;
    let stat = existing
      ? keyStatFromRecord(existing)
      : createKeyStat(code, (next.levels[code] ?? 0) as GuideLevel);

    stat = recordKeyPress(stat, {
      correctFirstAttempt: score.correctFirstAttempt,
      intervalMs: score.intervalMs,
      isFirstKeyOfLine: score.isFirstKeyOfLine,
      peeked: score.peeked,
      practisedIso: options.nowIso,
    });

    const unlockedAt = existing?.unlockedAt ?? options.nowIso;
    const record = keyStatToRecord(options.layoutId, stat, options.targetWpm, unlockedAt);
    next.keys.set(code, record);
    next.levels[code] = record.guideLevel;
    next.practisedCodes.add(code);

    if (score.peeked) {
      if (!next.nonPeekCodes.has(code)) {
        next.peekedOnlyCodes.add(code);
      }
    } else {
      next.nonPeekCodes.add(code);
      next.peekedOnlyCodes.delete(code);
    }

    if (record.guideLevel !== beforeLevel) {
      next.guideChanges.push({
        code,
        from: beforeLevel,
        to: record.guideLevel,
      });
    }

    if (!score.correctFirstAttempt) {
      next.errorsByKey[code] = (next.errorsByKey[code] ?? 0) + 1;
    }

    next.eyesUpDelta += eyesUpPoints(beforeLevel as GuideLevel, score.peeked);

    const prevChar = next.lastExpectedChar;
    if (
      prevChar &&
      prevChar !== ' ' &&
      score.expectedChar !== ' ' &&
      score.correctFirstAttempt &&
      !score.isFirstKeyOfLine
    ) {
      const pairId = `${prevChar}${score.expectedChar}`.toLowerCase();
      const pairExisting = next.pairs.get(pairId);
      let pair = pairExisting ? pairStatFromRecord(pairExisting) : createPairStat(pairId);
      pair = recordPairPress(pair, {
        correctFirstAttempt: score.correctFirstAttempt,
        intervalMs: score.intervalMs,
      });
      next.pairs.set(pairId, pairStatToRecord(options.layoutId, pair));
    }

    next.lastExpectedChar = score.expectedChar;
  }

  return next;
}

/**
 * Apply end-of-session fade step-ups for keys practised this session.
 */
export function applyEndSessionFade(
  state: MasteryApplyState,
  options: { layoutId: string; targetWpm: number },
): MasteryApplyState {
  const next: MasteryApplyState = {
    keys: new Map(state.keys),
    pairs: new Map(state.pairs),
    levels: { ...state.levels },
    lastExpectedChar: state.lastExpectedChar,
    practisedCodes: new Set(state.practisedCodes),
    peekedOnlyCodes: new Set(state.peekedOnlyCodes),
    nonPeekCodes: new Set(state.nonPeekCodes),
    eyesUpDelta: state.eyesUpDelta,
    guideChanges: [...state.guideChanges],
    errorsByKey: { ...state.errorsByKey },
  };

  for (const code of next.practisedCodes) {
    const existing = next.keys.get(code);
    if (!existing) continue;
    const before = existing.guideLevel;
    const peekedOnly = next.peekedOnlyCodes.has(code) && !next.nonPeekCodes.has(code);
    const faded = endSessionFadeUpdate(keyStatFromRecord(existing), options.targetWpm, {
      peekedOnly,
    });
    const record = keyStatToRecord(
      options.layoutId,
      faded,
      options.targetWpm,
      existing.unlockedAt,
    );
    next.keys.set(code, record);
    next.levels[code] = record.guideLevel;
    if (record.guideLevel !== before) {
      next.guideChanges.push({ code, from: before, to: record.guideLevel });
    }
  }

  return next;
}

/**
 * Seed unlockedAt on every code in learn-order groups up to unlockedGroupCount.
 */
export function seedUnlockedGroupKeys(
  layout: Layout,
  layoutId: string,
  keyRecords: readonly KeyStatRecord[],
  unlockedGroupCount: number,
  nowIso: string,
  targetWpm: number,
): KeyStatRecord[] {
  const byCode = new Map(keyRecords.map((k) => [k.code, k]));
  const groups = layout.learnOrder.slice(0, Math.max(1, unlockedGroupCount));
  for (const group of groups) {
    for (const code of group) {
      const existing = byCode.get(code);
      if (existing) {
        if (existing.unlockedAt == null) {
          byCode.set(code, { ...existing, unlockedAt: nowIso });
        }
      } else {
        const fresh = createKeyStat(code);
        byCode.set(
          code,
          keyStatToRecord(layoutId, fresh, targetWpm, nowIso),
        );
      }
    }
  }
  return [...byCode.values()];
}

/** First key code of the newly unlocked group (for unlock card target). */
export function unlockTargetCode(layout: Layout, unlockedGroupCount: number): string {
  const group = layout.learnOrder[Math.max(0, unlockedGroupCount - 1)];
  return group?.[0] ?? layout.learnOrder[0]?.[0] ?? 'KeyF';
}
