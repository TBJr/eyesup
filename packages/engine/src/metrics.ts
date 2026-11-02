import { WPM_CHARS_PER_WORD } from './params.js';

/** Gross WPM = (characters ÷ 5) ÷ minutes (§04). */
export function grossWpm(charactersTyped: number, durationMs: number): number {
  if (durationMs <= 0) {
    return 0;
  }
  const minutes = durationMs / 60_000;
  return (charactersTyped / WPM_CHARS_PER_WORD) / minutes;
}

/** Net WPM = gross − uncorrected errors per minute (§04). */
export function netWpm(
  charactersTyped: number,
  uncorrectedErrors: number,
  durationMs: number,
): number {
  if (durationMs <= 0) {
    return 0;
  }
  const minutes = durationMs / 60_000;
  const gross = grossWpm(charactersTyped, durationMs);
  return gross - uncorrectedErrors / minutes;
}

/** Accuracy = correct first attempts ÷ all keystrokes (§04). */
export function accuracy(correctFirstAttempts: number, totalKeystrokes: number): number {
  if (totalKeystrokes <= 0) {
    return 1;
  }
  return correctFirstAttempts / totalKeystrokes;
}
