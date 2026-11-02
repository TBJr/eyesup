import {
  DRILL_ONLY_MAX_GROUP,
  FOCUS_SHARE_MAX,
  FOCUS_SHARE_MIN,
  FOUNDATIONS_MAX_SAME_FINGER_STREAK,
  LINE_MAX_CHARS,
  LINE_MIN_CHARS,
} from './params.js';
import { fingerForChar, unlockedTypingChars } from './layout.js';
import type { SeededRandom } from './random.js';
import type { Layout, Line, LineKind, Track } from './types.js';

/**
 * Order-n letter Markov model for pseudo-words (§04).
 * `counts[context][next]` holds transition weights; context is (order−1) chars
 * left-padded with `^`, word ends use `$`.
 */
export interface LetterModel {
  readonly order: number;
  readonly counts: Record<string, Record<string, number>>;
}

export interface GenerateLineInput {
  readonly layout: Layout;
  readonly unlockedGroupCount: number;
  readonly focusChar: string;
  readonly track: Track;
  readonly kind?: LineKind;
  readonly letterModel: LetterModel;
  readonly wordList: readonly string[];
  readonly blocklist: readonly string[];
  readonly rng: SeededRandom;
}

const WORD_LINE_KINDS: readonly LineKind[] = [
  'pseudo_words',
  'real_words',
  'mixed_review',
];

export function isWordLineKind(kind: LineKind): boolean {
  return WORD_LINE_KINDS.includes(kind);
}

const GENERATION_ATTEMPTS = 300;

export function generateLine(input: GenerateLineInput): Line {
  const focus = input.focusChar.toLowerCase();
  const allowed = new Set(unlockedTypingChars(input.layout, input.unlockedGroupCount));
  if (!allowed.has(focus) || focus === ' ') {
    throw new RangeError('focusChar must be an unlocked typing character');
  }

  let kind = input.kind;
  if (kind === undefined) {
    kind = defaultKind(input.unlockedGroupCount, input.rng);
  }
  // Scheduler may request session block labels; map to generatable kinds.
  if (kind === 'warmup' || kind === 'cool_down') {
    kind = 'mixed_review';
  } else if (kind === 'blind_check') {
    kind = 'real_words';
  }
  if (input.unlockedGroupCount <= DRILL_ONLY_MAX_GROUP && isWordLineKind(kind)) {
    kind = input.rng.next() < 0.5 ? 'key_drill' : 'pair_drill';
  }

  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    const targetLength = input.rng.nextInt(LINE_MIN_CHARS, LINE_MAX_CHARS);
    let text = '';
    switch (kind) {
      case 'key_drill':
        text = buildKeyDrill(input, targetLength, focus, allowed);
        break;
      case 'pair_drill':
        text = buildPairDrill(input, targetLength, focus, allowed);
        break;
      case 'pseudo_words':
        text = buildWordLine(input, targetLength, focus, allowed, 'pseudo');
        break;
      case 'real_words':
        text = buildWordLine(input, targetLength, focus, allowed, 'real');
        break;
      case 'mixed_review':
        text = buildWordLine(input, targetLength, focus, allowed, 'mixed');
        break;
      default:
        throw new RangeError(`unsupported line kind: ${String(kind)}`);
    }

    if (text.length < LINE_MIN_CHARS || text.length > LINE_MAX_CHARS) {
      continue;
    }
    if (!lineUsesOnlyAllowed(text, allowed)) {
      continue;
    }
    if (input.track === 'foundations' && !foundationsFingerOk(input, text)) {
      continue;
    }
    if (lineHasBlocklistedWord(text, input.blocklist)) {
      continue;
    }
    if (isWordLineKind(kind)) {
      const share = focusShare(text, focus);
      if (share < FOCUS_SHARE_MIN || share > FOCUS_SHARE_MAX) {
        continue;
      }
    }

    return { text, kind, focusChar: focus };
  }

  throw new Error(`generateLine failed after ${GENERATION_ATTEMPTS} attempts`);
}

function defaultKind(groupCount: number, rng: SeededRandom): LineKind {
  if (groupCount <= DRILL_ONLY_MAX_GROUP) {
    return rng.next() < 0.5 ? 'key_drill' : 'pair_drill';
  }
  const roll = rng.next();
  if (roll < 0.45) {
    return 'real_words';
  }
  if (roll < 0.75) {
    return 'pseudo_words';
  }
  return 'mixed_review';
}

function letterChars(allowed: Set<string>): string[] {
  return [...allowed].filter((c) => c !== ' ');
}

function lineUsesOnlyAllowed(text: string, allowed: Set<string>): boolean {
  for (const ch of text) {
    if (!allowed.has(ch)) {
      return false;
    }
  }
  return true;
}

function focusShare(text: string, focusChar: string): number {
  let nonSpace = 0;
  let focus = 0;
  for (const ch of text) {
    if (ch === ' ') {
      continue;
    }
    nonSpace += 1;
    if (ch === focusChar) {
      focus += 1;
    }
  }
  if (nonSpace === 0) {
    return 0;
  }
  return focus / nonSpace;
}

function foundationsFingerOk(input: GenerateLineInput, text: string): boolean {
  let streak = 0;
  let lastFinger: string | undefined;
  for (const ch of text) {
    if (ch === ' ') {
      streak = 0;
      lastFinger = undefined;
      continue;
    }
    const finger = fingerForChar(input.layout, ch, input.unlockedGroupCount);
    if (finger === undefined) {
      return false;
    }
    if (finger === lastFinger) {
      streak += 1;
    } else {
      streak = 1;
      lastFinger = finger;
    }
    if (streak > FOUNDATIONS_MAX_SAME_FINGER_STREAK) {
      return false;
    }
  }
  return true;
}

function canAppendChar(
  input: GenerateLineInput,
  text: string,
  ch: string,
): boolean {
  if (input.track !== 'foundations' || ch === ' ') {
    return true;
  }
  const finger = fingerForChar(input.layout, ch, input.unlockedGroupCount);
  if (finger === undefined) {
    return false;
  }
  let streak = 0;
  let lastFinger: string | undefined;
  for (const existing of text) {
    if (existing === ' ') {
      streak = 0;
      lastFinger = undefined;
      continue;
    }
    const f = fingerForChar(input.layout, existing, input.unlockedGroupCount);
    if (f === lastFinger) {
      streak += 1;
    } else {
      streak = 1;
      lastFinger = f;
    }
  }
  if (finger === lastFinger) {
    streak += 1;
  } else {
    streak = 1;
  }
  return streak <= FOUNDATIONS_MAX_SAME_FINGER_STREAK;
}

function buildKeyDrill(
  input: GenerateLineInput,
  targetLength: number,
  focus: string,
  allowed: Set<string>,
): string {
  const letters = letterChars(allowed);
  const chunks: string[] = [];
  let length = 0;
  while (length < targetLength) {
    const chunkLen = input.rng.nextInt(2, 5);
    let chunk = '';
    for (let i = 0; i < chunkLen; i += 1) {
      const preferFocus = input.rng.next() < 0.55;
      const pool = preferFocus ? [focus] : letters;
      let picked = input.rng.pick(pool);
      let guard = 0;
      while (!canAppendChar(input, chunks.join(' ') + chunk, picked) && guard < 20) {
        picked = input.rng.pick(letters);
        guard += 1;
      }
      chunk += picked;
    }
    const candidate = chunks.length === 0 ? chunk : `${chunks.join(' ')} ${chunk}`;
    if (candidate.length > targetLength + 4) {
      break;
    }
    chunks.push(chunk);
    length = candidate.length;
  }
  return trimOrPad(input, chunks.join(' '), targetLength, focus, allowed);
}

function buildPairDrill(
  input: GenerateLineInput,
  targetLength: number,
  focus: string,
  allowed: Set<string>,
): string {
  const letters = letterChars(allowed);
  const pairs: string[] = [];
  for (const a of letters) {
    for (const b of letters) {
      pairs.push(a + b);
    }
  }
  const chunks: string[] = [];
  let length = 0;
  while (length < targetLength) {
    let pair = input.rng.pick(pairs);
    if (!pair.includes(focus) && input.rng.next() < 0.7) {
      pair = focus + input.rng.pick(letters);
    }
    const candidate = chunks.length === 0 ? pair : `${chunks.join(' ')} ${pair}`;
    if (!foundationsFingerOk(input, candidate.replace(/ /g, ''))) {
      continue;
    }
    if (candidate.length > targetLength + 3) {
      break;
    }
    chunks.push(pair);
    length = candidate.length;
  }
  return trimOrPad(input, chunks.join(' '), targetLength, focus, allowed);
}

type WordSource = 'pseudo' | 'real' | 'mixed';

function buildWordLine(
  input: GenerateLineInput,
  targetLength: number,
  focus: string,
  allowed: Set<string>,
  source: WordSource,
): string {
  const words: string[] = [];
  let length = 0;
  while (length < targetLength - 6) {
    const word = nextWord(input, focus, allowed, source);
    if (word === undefined) {
      break;
    }
    const candidate = words.length === 0 ? word : `${words.join(' ')} ${word}`;
    if (candidate.length > LINE_MAX_CHARS) {
      break;
    }
    words.push(word);
    length = candidate.length;
  }
  let line = words.join(' ');
  line = adjustFocusShare(input, line, focus, allowed, source, targetLength);
  return line;
}

function nextWord(
  input: GenerateLineInput,
  focus: string,
  allowed: Set<string>,
  source: WordSource,
): string | undefined {
  const usePseudo =
    source === 'pseudo' || (source === 'mixed' && input.rng.next() < 0.5);
  if (usePseudo) {
    return generatePseudoWord(input, focus, allowed);
  }
  const candidates = input.wordList.filter(
    (w) =>
      w.length > 0 &&
      w.includes(focus) &&
      [...w].every((ch) => allowed.has(ch)) &&
      !lineHasBlocklistedWord(w, input.blocklist),
  );
  if (candidates.length === 0) {
    return generatePseudoWord(input, focus, allowed);
  }
  return input.rng.pick(candidates);
}

function generatePseudoWord(
  input: GenerateLineInput,
  focus: string,
  allowed: Set<string>,
): string | undefined {
  const letters = letterChars(allowed);
  const order = Math.max(1, input.letterModel.order);
  const pad = order - 1;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    let context = '^'.repeat(pad);
    let word = '';
    for (let step = 0; step < 12; step += 1) {
      const next = sampleNext(input, context, letters);
      if (next === '$' || next === undefined) {
        break;
      }
      if (!canAppendChar(input, word, next)) {
        break;
      }
      word += next;
      context = (context + next).slice(-pad);
    }
    if (word.length < 3) {
      continue;
    }
    if (!word.includes(focus)) {
      const idx = input.rng.nextInt(0, word.length - 1);
      const chars = [...word];
      chars[idx] = focus;
      word = chars.join('');
    }
    if ([...word].every((ch) => allowed.has(ch)) && !lineHasBlocklistedWord(word, input.blocklist)) {
      return word;
    }
  }
  return undefined;
}

function sampleNext(
  input: GenerateLineInput,
  context: string,
  letters: string[],
): string | undefined {
  const row = input.letterModel.counts[context];
  if (!row) {
    return input.rng.pick(letters);
  }
  const entries: { char: string; weight: number }[] = [];
  let total = 0;
  for (const [char, weight] of Object.entries(row)) {
    if (weight <= 0) {
      continue;
    }
    if (char !== '$' && !letters.includes(char)) {
      continue;
    }
    entries.push({ char, weight });
    total += weight;
  }
  if (total === 0) {
    return input.rng.pick(letters);
  }
  let roll = input.rng.next() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.char;
    }
  }
  return entries[entries.length - 1]?.char;
}

function adjustFocusShare(
  input: GenerateLineInput,
  line: string,
  focus: string,
  allowed: Set<string>,
  source: WordSource,
  targetLength: number,
): string {
  let words = line.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    words = [focus.repeat(3)];
  }

  for (let i = 0; i < 60; i += 1) {
    const share = focusShare(words.join(' '), focus);
    if (share >= FOCUS_SHARE_MIN && share <= FOCUS_SHARE_MAX) {
      break;
    }
    if (share < FOCUS_SHARE_MIN) {
      words.push(focus.repeat(input.rng.nextInt(2, 4)));
    } else {
      const idx = input.rng.nextInt(0, words.length - 1);
      const replacement = nextWord(input, focus, allowed, source);
      if (replacement) {
        words[idx] = replacement;
      } else {
        words.splice(idx, 1);
      }
    }
  }

  let text = words.join(' ');
  while (text.length < LINE_MIN_CHARS) {
    const extra = nextWord(input, focus, allowed, source) ?? focus.repeat(3);
    text = `${text} ${extra}`;
  }
  if (text.length > LINE_MAX_CHARS) {
    text = text.slice(0, LINE_MAX_CHARS).trimEnd();
  }
  if (text.length < LINE_MIN_CHARS) {
    text = trimOrPad(input, text, targetLength, focus, allowed);
  }
  return text;
}

function trimOrPad(
  input: GenerateLineInput,
  text: string,
  targetLength: number,
  focus: string,
  allowed: Set<string>,
): string {
  let out = text;
  if (out.length > LINE_MAX_CHARS) {
    out = out.slice(0, LINE_MAX_CHARS).trimEnd();
  }
  while (out.length < LINE_MIN_CHARS) {
    const token = focus + input.rng.pick(letterChars(allowed));
    out = out.length === 0 ? token : `${out} ${token}`;
    if (out.length > LINE_MAX_CHARS) {
      out = out.slice(0, LINE_MAX_CHARS).trimEnd();
      break;
    }
  }
  if (out.length < LINE_MIN_CHARS && out.length > 0) {
    out = out.padEnd(LINE_MIN_CHARS, focus);
    out = out.slice(0, LINE_MAX_CHARS);
  }
  return out;
}

export function lineHasBlocklistedWord(text: string, blocklist: readonly string[]): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  for (const word of words) {
    if (isBlocklistedWord(word, blocklist)) {
      return true;
    }
  }
  return false;
}

function isBlocklistedWord(word: string, blocklist: readonly string[]): boolean {
  const lower = word.toLowerCase();
  for (const entry of blocklist) {
    const blocked = entry.toLowerCase();
    if (lower === blocked || editDistanceAtMostOne(lower, blocked)) {
      return true;
    }
  }
  return false;
}

export function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > 1) {
    return false;
  }
  if (lenA === lenB) {
    let mismatches = 0;
    for (let i = 0; i < lenA; i += 1) {
      if (a[i] !== b[i]) {
        mismatches += 1;
      }
    }
    return mismatches === 1;
  }
  const longer = lenA > lenB ? a : b;
  const shorter = lenA > lenB ? b : a;
  let i = 0;
  let j = 0;
  let usedSkip = false;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      i += 1;
      j += 1;
      continue;
    }
    if (usedSkip) {
      return false;
    }
    usedSkip = true;
    j += 1;
  }
  return true;
}
