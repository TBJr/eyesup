/**
 * Coder overlay helpers (EU-034 / FR-21).
 * Loads in-house snippets; App wires Library / session start.
 */

import { createSeededRandom, type Line, type SeededRandom } from '@eyesup/engine';
import snippetsJson from '../../../../packages/content/en/code/snippets.json';

export const CODER_OVERLAY_ID = 'coder';

export interface CodeSnippet {
  readonly id: string;
  readonly language: string;
  readonly title: string;
  readonly body: string;
}

export interface SnippetPack {
  readonly languages: readonly string[];
  readonly snippets: readonly CodeSnippet[];
}

export const snippetPack = snippetsJson as SnippetPack;

/** True when the learner profile includes the Coder overlay. */
export function isCoderEnabled(overlays: readonly string[] | null | undefined): boolean {
  return Boolean(overlays?.includes(CODER_OVERLAY_ID));
}

/** Pick one snippet with the seeded RNG (no Math.random). */
export function pickSnippet(
  rng: SeededRandom,
  pack: SnippetPack = snippetPack,
  language?: string,
): CodeSnippet {
  const pool =
    language == null
      ? pack.snippets
      : pack.snippets.filter((s) => s.language === language);
  if (pool.length === 0) {
    throw new RangeError('no snippets available');
  }
  return rng.pick(pool);
}

function focusFromText(text: string): string {
  const match = text.match(/[a-zA-Z0-9]/);
  return (match?.[0] ?? '{').toLowerCase();
}

/**
 * Turn a snippet body into practice lines (one per source line; blank lines dropped).
 * Kind is `real_words` so the existing typing surface treats them as content lines.
 */
export function linesFromSnippet(body: string): Line[] {
  return body
    .split(/\r?\n/)
    .map((line) => line.replace(/\t/g, '  '))
    .filter((line) => line.length > 0)
    .map((text) => ({
      text,
      kind: 'real_words' as const,
      focusChar: focusFromText(text),
    }));
}

/** Convenience: pick a snippet and expand to lines. */
export function linesFromRandomSnippet(
  seed: number,
  language?: string,
): { snippet: CodeSnippet; lines: Line[] } {
  const snippet = pickSnippet(createSeededRandom(seed), snippetPack, language);
  return { snippet, lines: linesFromSnippet(snippet.body) };
}
