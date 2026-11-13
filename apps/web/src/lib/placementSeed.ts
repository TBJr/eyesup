import {
  createKeyStat,
  confidence,
  targetMsPerChar,
  type GuideLevel,
  type Layout,
  type Track,
} from '@eyesup/engine';
import type { KeyStatRecord } from '../storage/types.js';

/** Adaptive starts at stage 4; Fluency unlocks all groups (spec §03). */
export function startingUnlockGroups(track: Track, layout: Layout): number {
  if (track === 'fluency') return layout.learnOrder.length;
  if (track === 'adaptive') return Math.min(4, layout.learnOrder.length);
  return 1;
}

export function startingGuideLevel(track: Track): GuideLevel {
  if (track === 'fluency') return 3;
  if (track === 'adaptive') return 2;
  return 0;
}

/**
 * Seed unlocked key rows for the placed track so the first session matches stage.
 */
export function seedKeysForPlacement(
  layout: Layout,
  layoutId: string,
  track: Track,
  targetWpm: number,
  nowIso: string,
  options?: { accurateBlindCodes?: readonly string[] },
): KeyStatRecord[] {
  const groups = startingUnlockGroups(track, layout);
  const codes = layout.learnOrder.slice(0, groups).flat();
  const accurate = new Set(options?.accurateBlindCodes ?? []);
  const out: KeyStatRecord[] = [];
  for (const code of codes) {
    let level = startingGuideLevel(track);
    if (track === 'adaptive') {
      level = accurate.has(code) ? 2 : 0;
    }
    const stat = createKeyStat(code, level);
    out.push({
      schemaVersion: 1,
      layoutId,
      code,
      unlockedAt: nowIso,
      guideLevel: stat.level,
      accuracy: 1,
      timeToTypeMs: targetMsPerChar(targetWpm),
      confidence: confidence(1, targetMsPerChar(targetWpm), targetWpm),
      presses: 0,
      stableSessions: 0,
      sessionsWithKey: 0,
      recentIntervalsMs: [],
      recentFirstAttempts: [],
      lastPractised: null,
    });
  }
  return out;
}
