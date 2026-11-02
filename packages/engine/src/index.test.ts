import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  confidence,
  createSeededRandom,
  editDistanceAtMostOne,
  fingerForChar,
  generateLine,
  grossWpm,
  isWordLineKind,
  lineHasBlocklistedWord,
  netWpm,
  parseLayout,
  recordKeyInterval,
  targetMsPerChar,
  unlockedTypingChars,
  updateAccuracyEwma,
  type Layout,
  type LetterModel,
} from './index.js';
import {
  DRILL_ONLY_MAX_GROUP,
  FOCUS_SHARE_MAX,
  FOCUS_SHARE_MIN,
  FOUNDATIONS_MAX_SAME_FINGER_STREAK,
  LINE_MAX_CHARS,
  LINE_MIN_CHARS,
} from './params.js';

const here = dirname(fileURLToPath(import.meta.url));
const layoutsDir = join(here, '../../layouts');

function loadLayout(fileName: string): Layout {
  const raw = readFileSync(join(layoutsDir, fileName), 'utf8');
  return parseLayout(JSON.parse(raw) as unknown);
}

const TEST_LETTER_MODEL: LetterModel = {
  order: 3,
  counts: {
    '^^': { a: 3, d: 2, f: 2, s: 1, $: 1 },
    '^a': { d: 2, f: 1, l: 2, $: 1 },
    '^f': { a: 2, d: 2, e: 1, $: 1 },
    'ad': { a: 1, d: 1, e: 1, $: 2 },
    'fa': { d: 2, l: 1, $: 1 },
  },
};

const TEST_WORDS = [
  'fad',
  'dad',
  'add',
  'fall',
  'flask',
  'sad',
  'deal',
  'leaf',
  'desk',
  'ask',
  'safe',
  'feeds',
  'like',
  'file',
  'fire',
  'user',
  'high',
  'she',
  'the',
  'they',
  'would',
  'work',
  'move',
  'very',
  'and',
  'been',
  'next',
  'size',
];

const BLOCKLIST = ['bad', 'damn', 'hell'];

function focusCharForGroup(layout: Layout, groupCount: number): string {
  const group = layout.learnOrder[groupCount - 1];
  if (!group) {
    throw new Error('invalid group');
  }
  for (const code of group) {
    if (code === 'Space') {
      continue;
    }
    for (const key of layout.keys) {
      if (key.code === code && key.base && key.base.length === 1 && key.base !== ' ') {
        return key.base.toLowerCase();
      }
    }
  }
  return 'f';
}

function filteredWords(layout: Layout, groupCount: number): string[] {
  const allowed = new Set(unlockedTypingChars(layout, groupCount));
  return TEST_WORDS.filter(
    (w) => w.length > 0 && [...w].every((ch) => allowed.has(ch)),
  );
}

function maxSameFingerRun(layout: Layout, groupCount: number, text: string): number {
  let max = 0;
  let streak = 0;
  let last: string | undefined;
  for (const ch of text) {
    if (ch === ' ') {
      streak = 0;
      last = undefined;
      continue;
    }
    const finger = fingerForChar(layout, ch, groupCount);
    if (finger === last) {
      streak += 1;
    } else {
      streak = 1;
      last = finger;
    }
    max = Math.max(max, streak);
  }
  return max;
}

function focusShare(text: string, focus: string): number {
  let nonSpace = 0;
  let count = 0;
  for (const ch of text) {
    if (ch === ' ') {
      continue;
    }
    nonSpace += 1;
    if (ch === focus) {
      count += 1;
    }
  }
  return nonSpace === 0 ? 0 : count / nonSpace;
}

describe('mastery', () => {
  it('matches worked confidence example at 30 WPM', () => {
    expect(targetMsPerChar(30)).toBe(400);
    expect(confidence(0.95, 500, 30)).toBeCloseTo(0.8, 5);
  });

  it('updates EWMA accuracy and median interval', () => {
    const ewma = updateAccuracyEwma(1, false);
    expect(ewma).toBeLessThan(1);
    const stat = recordKeyInterval(
      {
        code: 'KeyF',
        accuracy: 1,
        timeToTypeMs: 400,
        recentIntervalsMs: [500, 450],
        level: 0,
        lastPractisedIso: undefined,
        stableSessions: 0,
      },
      380,
      { isFirstKeyOfLine: false },
    );
    expect(stat.timeToTypeMs).toBeGreaterThan(0);
    const skipped = recordKeyInterval(stat, 5000, { isFirstKeyOfLine: false });
    expect(skipped.recentIntervalsMs.length).toBe(stat.recentIntervalsMs.length);
  });
});

describe('metrics and random', () => {
  it('computes WPM and accuracy', () => {
    expect(grossWpm(50, 60_000)).toBeCloseTo(10, 5);
    expect(netWpm(50, 2, 60_000)).toBeCloseTo(8, 5);
  });

  it('mulberry32 is deterministic', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    const seqA = [a.next(), a.nextInt(1, 6), a.pick(['x', 'y', 'z'])];
    const seqB = [b.next(), b.nextInt(1, 6), b.pick(['x', 'y', 'z'])];
    expect(seqA).toEqual(seqB);
    const shuffled = a.shuffle([1, 2, 3, 4]);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4]);
  });
});

describe('blocklist distance', () => {
  it('flags edit-distance-one whole words', () => {
    expect(editDistanceAtMostOne('cat', 'bat')).toBe(true);
    expect(editDistanceAtMostOne('cat', 'cats')).toBe(true);
    expect(editDistanceAtMostOne('cat', 'dog')).toBe(false);
    expect(lineHasBlocklistedWord('ok cat ok', ['bat'])).toBe(true);
  });
});

const PROPERTY_SEEDS = 1000;

describe.each(['qwerty-us.json', 'qwerty-uk.json'])('generateLine on %s', (file) => {
  const layout = loadLayout(file);
  const groupCounts = Array.from({ length: layout.learnOrder.length }, (_, i) => i + 1);

  it.each(groupCounts)(
    'satisfies constraints for learn-order prefix of %i groups across 1000 seeds',
    (groups) => {
      const focus = focusCharForGroup(layout, groups);
      const words = filteredWords(layout, groups);
      const allowed = new Set(unlockedTypingChars(layout, groups));
      const failures: string[] = [];

      for (let seed = 0; seed < PROPERTY_SEEDS; seed += 1) {
        const rng = createSeededRandom(seed + groups * 10_000 + layout.id.length);
        const baseInput = {
          layout,
          unlockedGroupCount: groups,
          focusChar: focus,
          track: 'foundations' as const,
          letterModel: TEST_LETTER_MODEL,
          wordList: words.length > 0 ? words : [focus.repeat(3)],
          blocklist: BLOCKLIST,
          rng,
        };
        const line = generateLine(
          groups > DRILL_ONLY_MAX_GROUP
            ? { ...baseInput, kind: 'real_words' as const }
            : baseInput,
        );

        if (line.text.length < LINE_MIN_CHARS || line.text.length > LINE_MAX_CHARS) {
          failures.push(`seed ${seed}: length ${line.text.length}`);
        }
        for (const ch of line.text) {
          if (!allowed.has(ch)) {
            failures.push(`seed ${seed}: locked char ${JSON.stringify(ch)}`);
            break;
          }
        }
        if (lineHasBlocklistedWord(line.text, BLOCKLIST)) {
          failures.push(`seed ${seed}: blocklist hit in ${JSON.stringify(line.text)}`);
        }
        const streak = maxSameFingerRun(layout, groups, line.text);
        if (streak > FOUNDATIONS_MAX_SAME_FINGER_STREAK) {
          failures.push(`seed ${seed}: same-finger streak ${streak}`);
        }
        if (isWordLineKind(line.kind)) {
          const share = focusShare(line.text, focus);
          if (share < FOCUS_SHARE_MIN || share > FOCUS_SHARE_MAX) {
            failures.push(`seed ${seed}: focus share ${share}`);
          }
        }
        if (failures.length > 5) {
          break;
        }
      }

      expect(failures).toEqual([]);
    },
    60_000,
  );
});
