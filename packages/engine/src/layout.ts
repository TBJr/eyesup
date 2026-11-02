import type { Finger, Layout, LayoutKey } from './types.js';

const keyByCodeCache = new WeakMap<Layout, Map<string, LayoutKey>>();

function keyMap(layout: Layout): Map<string, LayoutKey> {
  let map = keyByCodeCache.get(layout);
  if (!map) {
    map = new Map();
    for (const key of layout.keys) {
      map.set(key.code, key);
    }
    keyByCodeCache.set(layout, map);
  }
  return map;
}

export function keyByCode(layout: Layout, code: string): LayoutKey | undefined {
  return keyMap(layout).get(code);
}

export function fingerByCode(layout: Layout, code: string): Finger | undefined {
  return keyMap(layout).get(code)?.finger;
}

/** True when the layout value is a single printable typing character. */
export function isTypingCharacter(value: string | undefined): value is string {
  return value !== undefined && value.length === 1 && value !== ' ';
}

/** Lowercase typing character produced by a key in default (unshifted) layer. */
export function baseChar(key: LayoutKey): string | undefined {
  const b = key.base;
  if (b === undefined || b.length !== 1) {
    return undefined;
  }
  if (b === ' ') {
    return ' ';
  }
  return b.toLowerCase();
}

export function charForCode(
  layout: Layout,
  code: string,
  options?: { shift?: boolean },
): string | undefined {
  const entry = keyByCode(layout, code);
  if (!entry) {
    return undefined;
  }
  const raw = options?.shift ? entry.shift ?? entry.base : entry.base;
  if (raw === undefined || raw.length !== 1) {
    return undefined;
  }
  if (raw === ' ') {
    return ' ';
  }
  return raw.toLowerCase();
}

/** Physical key codes unlocked for the first `groupCount` learn-order groups. */
export function unlockedCodes(layout: Layout, groupCount: number): string[] {
  const groups = layout.learnOrder.slice(0, Math.max(0, groupCount));
  const codes: string[] = [];
  for (const group of groups) {
    for (const code of group) {
      codes.push(code);
    }
  }
  return codes;
}

/** Typing characters (plus space) available after `groupCount` groups are unlocked. */
export function unlockedTypingChars(layout: Layout, groupCount: number): string[] {
  const chars = new Set<string>();
  for (const code of unlockedCodes(layout, groupCount)) {
    const entry = keyByCode(layout, code);
    if (!entry) {
      continue;
    }
    const ch = baseChar(entry);
    if (ch !== undefined) {
      chars.add(ch);
    }
  }
  if (unlockedCodes(layout, groupCount).includes('Space')) {
    chars.add(' ');
  }
  return [...chars].sort();
}

/** Map typing character to a physical code (first match in unlock order). */
export function codeForChar(layout: Layout, char: string, groupCount: number): string | undefined {
  const target = char === ' ' ? ' ' : char.toLowerCase();
  for (const code of unlockedCodes(layout, groupCount)) {
    const produced = charForCode(layout, code);
    if (produced === target) {
      return code;
    }
  }
  return undefined;
}

export function fingerForChar(
  layout: Layout,
  char: string,
  groupCount: number,
): Finger | undefined {
  const code = codeForChar(layout, char, groupCount);
  if (code === undefined) {
    return undefined;
  }
  return fingerByCode(layout, code);
}

export function parseLayout(data: unknown): Layout {
  if (typeof data !== 'object' || data === null) {
    throw new TypeError('layout must be an object');
  }
  return data as Layout;
}
