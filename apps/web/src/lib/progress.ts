import {
  CROSSOVER_PROJECTION_SESSIONS,
  LINE_MAX_CHARS,
  LINE_MIN_CHARS,
  projectCrossoverSession,
  type CrossoverProjection,
  type Line,
} from '@eyesup/engine';
import type { BaselineRecord, SessionRecord } from '../storage/types.js';

/** Replace `{n}` placeholders in interface strings. */
export function fillTemplate(template: string, n: number | string): string {
  return template.replace(/\{n\}/g, String(n));
}

/** Last N completed sessions, newest last (for display reverse separately). */
export function recentSessions(
  sessions: readonly SessionRecord[],
  limit = 10,
): SessionRecord[] {
  return sessions
    .filter((s) => s.endedAt != null)
    .slice(-limit);
}

/** Blind-check session net WPMs for crossover projection (oldest → newest). */
export function blindWpmsForCrossover(
  sessions: readonly SessionRecord[],
  limit: number = CROSSOVER_PROJECTION_SESSIONS,
): number[] {
  return sessions
    .filter((s) => s.blindCheck && s.netWpm != null && s.endedAt != null)
    .slice(-limit)
    .map((s) => s.netWpm!);
}

export function crossoverFromBaseline(
  baseline: BaselineRecord | null | undefined,
  sessions: readonly SessionRecord[],
): CrossoverProjection | null {
  if (!baseline || baseline.sightedWpm <= 0) return null;
  const blinds = blindWpmsForCrossover(sessions);
  if (blinds.length === 0) {
    return projectCrossoverSession(baseline.sightedWpm, []);
  }
  return projectCrossoverSession(baseline.sightedWpm, blinds);
}

/** Split own text into practice lines (~40–60 chars). */
export function splitOwnTextToLines(body: string): Line[] {
  const text = body.replace(/\s+/g, ' ').trim();
  if (!text) return [];

  const lines: Line[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + LINE_MAX_CHARS, text.length);
    if (end < text.length) {
      const space = text.lastIndexOf(' ', end);
      if (space >= i + LINE_MIN_CHARS) {
        end = space;
      } else if (space > i) {
        end = space;
      }
    }
    const chunk = text.slice(i, end).trim();
    if (chunk.length > 0) {
      const focus = (chunk.match(/[a-zA-Z]/)?.[0] ?? 'a').toLowerCase();
      lines.push({ text: chunk, kind: 'real_words', focusChar: focus });
    }
    i = end;
    while (text[i] === ' ') i += 1;
  }
  return lines;
}

export const TRACK_OPTIONS = [
  'foundations',
  'retrain',
  'adaptive',
  'fluency',
] as const;

export type TrackOption = (typeof TRACK_OPTIONS)[number];

export function goalWpmOptions(min = 15, max = 80): number[] {
  const out: number[] = [];
  for (let w = min; w <= max; w += 1) out.push(w);
  return out;
}
