import {
  createKeyStat,
  createPairStat,
  effectiveUnlockGroupCount,
  targetMsPerChar,
  TARGET_WPM_FOUNDATIONS_START,
  type KeyStat,
  type Layout,
  type PairStat,
  type Track,
} from '@eyesup/engine';
import type { KeyStatRecord, PairStatRecord } from '../storage/types.js';

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

/** Lightweight KeyStatRecord bump after a completed line (presses + last practised). */
export function bumpKeyStatAfterLine(
  existing: KeyStatRecord | undefined,
  layoutId: string,
  code: string,
  nowIso: string,
  pressesDelta: number,
): KeyStatRecord {
  if (existing) {
    return {
      ...existing,
      presses: existing.presses + pressesDelta,
      lastPractised: nowIso,
      unlockedAt: existing.unlockedAt ?? nowIso,
    };
  }
  const fresh = createKeyStat(code);
  return {
    schemaVersion: 1,
    layoutId,
    code,
    unlockedAt: nowIso,
    guideLevel: fresh.level,
    accuracy: fresh.accuracy,
    timeToTypeMs: fresh.timeToTypeMs,
    confidence: 0,
    presses: pressesDelta,
    stableSessions: 0,
    sessionsWithKey: 1,
    recentIntervalsMs: [],
    recentFirstAttempts: [],
    lastPractised: nowIso,
  };
}
