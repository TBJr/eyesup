import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '@eyesup/engine';
import {
  isCoderEnabled,
  linesFromRandomSnippet,
  linesFromSnippet,
  pickSnippet,
  snippetPack,
} from './coderOverlay.js';

describe('coderOverlay', () => {
  it('detects coder overlay flag', () => {
    expect(isCoderEnabled(['coder'])).toBe(true);
    expect(isCoderEnabled(['numbers'])).toBe(false);
    expect(isCoderEnabled(null)).toBe(false);
  });

  it('loads snippets from the English pack', () => {
    expect(snippetPack.languages.length).toBeGreaterThan(0);
    expect(snippetPack.snippets.length).toBeGreaterThan(0);
  });

  it('pickSnippet is deterministic for a seed', () => {
    const a = pickSnippet(createSeededRandom(42));
    const b = pickSnippet(createSeededRandom(42));
    expect(a.id).toBe(b.id);
  });

  it('pickSnippet can filter by language', () => {
    const snip = pickSnippet(createSeededRandom(1), snippetPack, 'py');
    expect(snip.language).toBe('py');
  });

  it('linesFromSnippet splits on newlines and keeps indentation', () => {
    const lines = linesFromSnippet('def greet(name: str) -> str:\n    return f"hi {name}"');
    expect(lines).toHaveLength(2);
    expect(lines[0]!.text).toBe('def greet(name: str) -> str:');
    expect(lines[1]!.text.startsWith('  ')).toBe(true);
    expect(lines[0]!.kind).toBe('real_words');
    expect(lines[0]!.focusChar).toBe('d');
  });

  it('linesFromRandomSnippet returns at least one line', () => {
    const { lines, snippet } = linesFromRandomSnippet(99);
    expect(snippet.id.length).toBeGreaterThan(0);
    expect(lines.length).toBeGreaterThan(0);
  });
});
