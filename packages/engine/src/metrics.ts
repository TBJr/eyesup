import { WPM_CHARS_PER_WORD } from './params.js';

/** Gross WPM = (characters ÷ 5) ÷ minutes (§04). */
export function grossWpm(charactersTyped: number, durationMs: number): number {
  if (durationMs <= 0) {
    return 0;
  }
  const minutes = durationMs / 60_000;
  return charactersTyped / WPM_CHARS_PER_WORD / minutes;
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
export function accuracy(
  correctFirstAttempts: number,
  totalKeystrokes: number,
): number {
  if (totalKeystrokes <= 0) {
    return 1;
  }
  return correctFirstAttempts / totalKeystrokes;
}

/** Consistency = 1 − CV of inter-key intervals within a line (§04). */
export function consistency(intervalsMs: readonly number[]): number {
  if (intervalsMs.length < 2) {
    return 1;
  }
  let sum = 0;
  for (const v of intervalsMs) {
    sum += v;
  }
  const mean = sum / intervalsMs.length;
  if (mean <= 0) {
    return 0;
  }
  let varSum = 0;
  for (const v of intervalsMs) {
    const d = v - mean;
    varSum += d * d;
  }
  const sd = Math.sqrt(varSum / intervalsMs.length);
  return Math.max(0, 1 - sd / mean);
}

/** Rollover share = keydowns before previous keyup ÷ all keydowns (§04). */
export function rolloverShare(
  rolloverKeydowns: number,
  totalKeydowns: number,
): number {
  if (totalKeydowns <= 0) {
    return 0;
  }
  return rolloverKeydowns / totalKeydowns;
}

/** Blind share = L3 keystrokes ÷ all keystrokes (§04). */
export function blindShare(l3Keystrokes: number, totalKeystrokes: number): number {
  if (totalKeystrokes <= 0) {
    return 0;
  }
  return l3Keystrokes / totalKeystrokes;
}

/** Peek rate = peeks per 100 keystrokes (§04). */
export function peekRate(peeks: number, totalKeystrokes: number): number {
  if (totalKeystrokes <= 0) {
    return 0;
  }
  return (peeks / totalKeystrokes) * 100;
}

/** Crossover gap = blind net WPM − day-1 sighted net WPM (§04). */
export function crossoverGap(blindNetWpm: number, day1SightedNetWpm: number): number {
  return blindNetWpm - day1SightedNetWpm;
}
