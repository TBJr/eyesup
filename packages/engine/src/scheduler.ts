import {
  BLIND_CHECK_EVERY_N_SESSIONS,
  BLOCK_BLIND_OR_COOLDOWN_SHARE,
  BLOCK_MIXED_REVIEW_SHARE,
  BLOCK_NEW_KEYS_SHARE,
  BLOCK_WARMUP_SHARE,
  BLOCK_WORDS_TEXT_SHARE,
  SESSION_LINES_PER_MINUTE,
} from './params.js';
import { generateLine, type GenerateLineInput, type LetterModel } from './generator.js';
import {
  isDueForReview,
  selectFocusKey,
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

function generateOfKind(
  base: Omit<GenerateLineInput, 'kind' | 'focusChar'>,
  kind: LineKind,
  focusChar: string,
): Line {
  const genKind: LineKind =
    kind === 'warmup' || kind === 'cool_down'
      ? 'mixed_review'
      : kind === 'blind_check'
        ? 'real_words'
        : kind;
  const line = generateLine({ ...base, kind: genKind, focusChar });
  return { ...line, kind };
}

/**
 * Plan one practice session (§04 scheduler, C1, C2, EU-015, EU-016).
 */
export function planSession(input: PlanSessionInput): PlanSessionResult {
  let learner = tryUnlockNextGroup(input.learner);
  const minutes = input.minutes ?? learner.dailyMinutes;
  const n = Math.max(1, Math.round(minutes * SESSION_LINES_PER_MINUTE));

  const focusStat = selectFocusKey(learner.keys, learner.targetWpm);
  const focusChar = focusCharFromStat(input.layout, focusStat);

  const due = learner.keys.filter((k) =>
    isDueForReview(k, learner.targetWpm, input.nowIso),
  );

  const warm = shareCount(n, BLOCK_WARMUP_SHARE);
  const neu = shareCount(n, BLOCK_NEW_KEYS_SHARE);
  const mixed = shareCount(n, BLOCK_MIXED_REVIEW_SHARE);
  const words = shareCount(n, BLOCK_WORDS_TEXT_SHARE);
  let tail = shareCount(n, BLOCK_BLIND_OR_COOLDOWN_SHARE);
  // Fix rounding so totals match n
  const assigned = warm + neu + mixed + words + tail;
  if (assigned < n) {
    tail += n - assigned;
  }

  const genBase = {
    layout: input.layout,
    unlockedGroupCount: learner.unlockedGroupCount,
    track: learner.track as Track,
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
  for (let i = 0; i < neu; i += 1) {
    lines.push(generateOfKind(genBase, 'key_drill', focusChar));
  }
  for (let i = 0; i < mixed; i += 1) {
    lines.push(generateOfKind(genBase, 'mixed_review', focusChar));
  }
  for (let i = 0; i < words; i += 1) {
    const kind: LineKind = i % 2 === 0 ? 'real_words' : 'pseudo_words';
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
