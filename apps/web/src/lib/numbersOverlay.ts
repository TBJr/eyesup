/**
 * Numbers overlay helpers (EU-035 / FR-22).
 * Number-row drills are data-driven from layout.keys (base 0–9).
 * Keypad lessons (K17) are out of scope for this helper slice.
 */

import {
  LINE_MAX_CHARS,
  LINE_MIN_CHARS,
  type Layout,
  type Line,
  type SeededRandom,
} from '@eyesup/engine';

export const NUMBERS_OVERLAY_ID = 'numbers';

/** True when the learner profile includes the Numbers overlay. */
export function isNumbersEnabled(overlays: readonly string[] | null | undefined): boolean {
  return Boolean(overlays?.includes(NUMBERS_OVERLAY_ID));
}

/**
 * Digit characters present on the layout number row, in layout key order.
 * Only keys whose `base` is a single digit 0–9.
 */
export function digitCharsFromLayout(layout: Layout): string[] {
  const digits: string[] = [];
  for (const key of layout.keys) {
    const base = key.base;
    if (base != null && /^[0-9]$/.test(base)) {
      digits.push(base);
    }
  }
  return digits;
}

function focusDigit(digits: readonly string[], rng: SeededRandom): string {
  if (digits.length === 0) {
    throw new RangeError('layout has no digit keys');
  }
  return rng.pick(digits);
}

/**
 * Build one number-row drill line (40–60 chars) from layout digits.
 * Spaces break runs so the line is readable; kind is `key_drill`.
 */
export function generateNumberDrillLine(
  layout: Layout,
  rng: SeededRandom,
  focusChar?: string,
): Line {
  const digits = digitCharsFromLayout(layout);
  if (digits.length === 0) {
    throw new RangeError('layout has no digit keys');
  }
  const focus = focusChar != null && digits.includes(focusChar) ? focusChar : focusDigit(digits, rng);
  const targetLen = rng.nextInt(LINE_MIN_CHARS, LINE_MAX_CHARS);

  const chars: string[] = [];
  let sinceSpace = 0;
  while (chars.length < targetLen) {
    const useFocus = rng.next() < 0.3;
    const ch = useFocus ? focus : rng.pick(digits);
    chars.push(ch);
    sinceSpace += 1;
    if (sinceSpace >= 4 && chars.length < targetLen - 1 && rng.next() < 0.35) {
      chars.push(' ');
      sinceSpace = 0;
    }
  }

  let text = chars.join('').trim();
  if (text.replace(/\s/g, '').length < LINE_MIN_CHARS) {
    while (text.replace(/\s/g, '').length < LINE_MIN_CHARS) {
      text += rng.pick(digits);
    }
  }
  if (text.length > LINE_MAX_CHARS) {
    text = text.slice(0, LINE_MAX_CHARS).trimEnd();
  }

  return { text, kind: 'key_drill', focusChar: focus };
}

/** Several number-row drill lines for a Library practice block. */
export function generateNumberDrillLines(
  layout: Layout,
  rng: SeededRandom,
  count = 4,
): Line[] {
  const lines: Line[] = [];
  for (let i = 0; i < count; i += 1) {
    lines.push(generateNumberDrillLine(layout, rng));
  }
  return lines;
}
