import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const keyboardSource = readFileSync(join(here, 'Keyboard.svelte'), 'utf8');
const tokens = JSON.parse(
  readFileSync(join(here, '../../../tokens/tokens.json'), 'utf8'),
) as {
  color: { dark: { heat: { low: { $value: string }; high: { $value: string } } } };
  opacity: { fingerKeyFill: { $value: number } };
};

describe('Keyboard dark-mode visibility contract', () => {
  it('mixes finger and heat fills against surface-key, never white', () => {
    expect(keyboardSource).not.toMatch(/color-mix\([^)]*\bwhite\b/);
    expect(keyboardSource).toContain('var(--color-surface-key');
    expect(keyboardSource).toMatch(/var\(--finger\)\s+22%/);
  });

  it('uses dashed guide outline for L2 keys', () => {
    expect(keyboardSource).toContain('border-style: dashed');
    expect(keyboardSource).toContain('var(--color-guide-outline');
  });

  it('uses dark heat tokens distinct from the light floor', () => {
    expect(tokens.color.dark.heat.low.$value.toLowerCase()).not.toBe('#e8eefc');
    expect(tokens.color.dark.heat.high.$value.toLowerCase()).toBe('#6e8cff');
    expect(tokens.opacity.fingerKeyFill.$value).toBe(0.22);
  });
});

describe('Keyboard glyph sizing contract', () => {
  it('scales wide-key legends with --key instead of a fixed rem', () => {
    expect(keyboardSource).toContain('wide-glyph');
    expect(keyboardSource).toContain('isWideKey');
    expect(keyboardSource).toContain('font-size: calc(var(--key) * 0.34)');
    expect(keyboardSource).toContain('font-size: max(9px, calc(var(--key) * 0.2))');
    expect(keyboardSource).not.toMatch(/\.glyph\s*\{[^}]*font-size:\s*0\.85rem/);
  });
});
