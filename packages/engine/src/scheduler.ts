import {
  BLIND_CHECK_EVERY_N_SESSIONS,
  BLOCK_BLIND_OR_COOLDOWN_SHARE,
  BLOCK_MIXED_REVIEW_SHARE,
  BLOCK_NEW_KEYS_SHARE,
  BLOCK_WARMUP_SHARE,
  BLOCK_WORDS_TEXT_SHARE,
  NEW_KEYS_DAILY_CAP_MINUTES,
  SESSION_LINES_PER_MINUTE,
} from './params.js';
import { generateLine, type GenerateLineInput, type LetterModel } from './generator.js';
import {
  isDueForReview,
  selectFocusKey,
  slowestPairs,
  tryUnlockNextGroup,
} from './mastery.js';
import type { SeededRandom } from './random.js';
import type { KeyStat, Layout, Learner, Line, LineKind, Track } from './types.js';

export interface PlanSessionInput {
  readonly learner: Learner;
  readonly layout: Layout;
  readonly letterModel: LetterModel;
  readonly wordList: readonly string[];
  readonly blocklist: readonly string[];
  readonly rng: SeededRandom;
  /** ISO timestamp used for spaced-review due checks. */
  readonly nowIso: string;
  /** Optional override of planned minutes (defaults to learner.dailyMinutes). */
  readonly minutes?: number;
  /**
   * Minutes already spent on new-key blocks today (EU / §04 daily cap).
   * When >= NEW_KEYS_DAILY_CAP_MINUTES, the new-keys share is redistributed.
   */
  readonly newKeysMinutesToday?: number;
}

export interface PlanSessionResult {
  readonly learner: Learner;
  readonly lines: Line[];
  readonly focusChar: string;
  readonly includesBlindCheck: boolean;
}

function shareCount(total: number, share: number): number {
  return Math.max(0, Math.round(total * share));
}

/**
 * True when the upcoming session (1-based index sessionCount+1) gets a blind check (C1, C2).
 */
export function sessionGetsBlindCheck(sessionCountCompleted: number): boolean {
  const upcoming = sessionCountCompleted + 1;
  return upcoming > 0 && upcoming % BLIND_CHECK_EVERY_N_SESSIONS === 0;
}

function charForCode(layout: Layout, code: string): string | undefined {
  const key = layout.keys.find((k) => k.code === code);
  return key?.base?.toLowerCase();
}

function focusCharFromStat(layout: Layout, focus: KeyStat): string {
  const ch = charForCode(layout, focus.code);
  if (!ch || ch === ' ') {
    // Fall back to first learn-order typing char
    for (const group of layout.learnOrder) {
      for (const code of group) {
        const c = charForCode(layout, code);
        if (c && c !== ' ') {
          return c;
        }
      }
    }
    return 'a';
  }
  return ch;
}

function generationKind(kind: LineKind): LineKind {
  if (kind === 'warmup' || kind === 'cool_down' || kind === 'rollover_drill') {
    return 'mixed_review';
  }
  if (kind === 'blind_check' || kind === 'metronome' || kind === 'timed_test') {
    return 'real_words';
  }
  return kind;
}

function generateOfKind(
  base: Omit<GenerateLineInput, 'kind' | 'focusChar'>,
  kind: LineKind,
  focusChar: string,
): Line {
  const line = generateLine({
    ...base,
    kind: generationKind(kind),
    focusChar,
  });
  return { ...line, kind };
}

function pairFocusChar(learner: Learner, fallback: string): string {
  const slow = slowestPairs(learner.pairs, learner.targetWpm);
  if (slow.length === 0) {
    return fallback;
  }
  for (const ch of slow[0]!.pair) {
    const lower = ch.toLowerCase();
    if (lower !== ' ') {
      return lower;
    }
  }
  return fallback;
}

/**
 * Plan one practice session (§04 scheduler, C1, C2, EU-015, EU-016, FR-19, FR-20).
 *
 * Track notes:
 * - fluency: all groups unlocked for generation; half of new-keys → pair_drill;
 *   more real_words; mixed_review yields some pair_drill + one metronome + one rollover_drill.
 * - retrain: caller sets learner.unlockedGroupCount to the physical count
 *   (via effectiveUnlockGroupCount / retrainPhysicalGroups).
 * - adaptive/fluency: pair_drill when learner.pairs is non-empty.
 */
export function planSession(input: PlanSessionInput): PlanSessionResult {
  let learner = tryUnlockNextGroup(input.learner);
  const minutes = input.minutes ?? learner.dailyMinutes;
  const n = Math.max(1, Math.round(minutes * SESSION_LINES_PER_MINUTE));
  const track = learner.track as Track;

  const focusStat = selectFocusKey(learner.keys, learner.targetWpm);
  const focusChar = focusCharFromStat(input.layout, focusStat);
  const usePairs =
    learner.pairs.length > 0 && (track === 'fluency' || track === 'adaptive');
  const pairFocus = usePairs ? pairFocusChar(learner, focusChar) : focusChar;

  const due = learner.keys.filter((k) =>
    isDueForReview(k, learner.targetWpm, input.nowIso),
  );

  const warm = shareCount(n, BLOCK_WARMUP_SHARE);
  let neu = shareCount(n, BLOCK_NEW_KEYS_SHARE);
  let mixed = shareCount(n, BLOCK_MIXED_REVIEW_SHARE);
  let words = shareCount(n, BLOCK_WORDS_TEXT_SHARE);
  let tail = shareCount(n, BLOCK_BLIND_OR_COOLDOWN_SHARE);

  const newKeysToday = input.newKeysMinutesToday ?? 0;
  if (newKeysToday >= NEW_KEYS_DAILY_CAP_MINUTES && neu > 0) {
    mixed += neu;
    neu = 0;
  }

  // Fluency: shift a word-line from mixed into words for more real_words practice.
  if (track === 'fluency' && mixed > 0) {
    mixed -= 1;
    words += 1;
  }

  const assigned = warm + neu + mixed + words + tail;
  if (assigned < n) {
    tail += n - assigned;
  } else if (assigned > n) {
    const overflow = assigned - n;
    if (tail >= overflow) {
      tail -= overflow;
    } else if (mixed >= overflow) {
      mixed -= overflow;
    } else {
      neu = Math.max(0, neu - overflow);
    }
  }

  const unlockedGroupCount =
    track === 'fluency' ? input.layout.learnOrder.length : learner.unlockedGroupCount;

  const genBase = {
    layout: input.layout,
    unlockedGroupCount,
    track,
    letterModel: input.letterModel,
    wordList: input.wordList,
    blocklist: input.blocklist,
    rng: input.rng,
  };

  const lines: Line[] = [];

  for (let i = 0; i < warm; i += 1) {
    const dueFocus =
      due.length > 0
        ? focusCharFromStat(input.layout, due[i % due.length]!)
        : focusChar;
    lines.push(generateOfKind(genBase, 'warmup', dueFocus));
  }

  // Fluency / adaptive with pairs: replace half of new-keys with pair_drill.
  const pairFromNew =
    track === 'fluency' || (track === 'adaptive' && usePairs)
      ? Math.floor(neu / 2)
      : 0;
  const keyDrillCount = neu - pairFromNew;
  for (let i = 0; i < keyDrillCount; i += 1) {
    lines.push(generateOfKind(genBase, 'key_drill', focusChar));
  }
  for (let i = 0; i < pairFromNew; i += 1) {
    lines.push(generateOfKind(genBase, 'pair_drill', pairFocus));
  }

  // Fluency: one metronome + one rollover_drill from the mixed block; rest may be pair_drill.
  let mixedLeft = mixed;
  if (track === 'fluency' && mixedLeft > 0) {
    lines.push(generateOfKind(genBase, 'metronome', focusChar));
    mixedLeft -= 1;
  }
  if (track === 'fluency' && mixedLeft > 0) {
    lines.push(generateOfKind(genBase, 'rollover_drill', focusChar));
    mixedLeft -= 1;
  }
  for (let i = 0; i < mixedLeft; i += 1) {
    const kind: LineKind =
      usePairs && (track === 'fluency' || track === 'adaptive') && i % 2 === 0
        ? 'pair_drill'
        : 'mixed_review';
    lines.push(
      generateOfKind(genBase, kind, kind === 'pair_drill' ? pairFocus : focusChar),
    );
  }

  for (let i = 0; i < words; i += 1) {
    // Fluency prefers real_words; others alternate with pseudo_words.
    const kind: LineKind =
      track === 'fluency' || i % 2 === 0 ? 'real_words' : 'pseudo_words';
    lines.push(generateOfKind(genBase, kind, focusChar));
  }

  const blind = sessionGetsBlindCheck(learner.sessionCount);
  for (let i = 0; i < tail; i += 1) {
    lines.push(
      generateOfKind(genBase, blind ? 'blind_check' : 'cool_down', focusChar),
    );
  }

  return {
    learner,
    lines,
    focusChar,
    includesBlindCheck: blind,
  };
}
