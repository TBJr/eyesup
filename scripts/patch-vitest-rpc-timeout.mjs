#!/usr/bin/env node
// Vitest's birpc default timeout is 60s. The engine property suite can keep a
// worker busy longer while coverage is collected, which surfaces as
// `[vitest-worker]: Timeout calling "onTaskUpdate"`. Raise the timeout locally
// in node_modules after install. Zero dependencies.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'node_modules');
const needle = 'const DEFAULT_TIMEOUT = 6e4';
const replacement = 'const DEFAULT_TIMEOUT = 6e5';

/** @param {string} dir */
function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.pnpm' || entry.name === 'vitest' || entry.name.startsWith('vitest@')) {
        walk(path);
      } else if (dir.includes('vitest')) {
        walk(path);
      }
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;
    if (!entry.name.includes('index.') && !path.includes('chunks/index.')) continue;
    let text;
    try {
      text = readFileSync(path, 'utf8');
    } catch {
      continue;
    }
    if (!text.includes(needle)) continue;
    writeFileSync(path, text.replaceAll(needle, replacement));
    console.log(`patched ${path}`);
  }
}

walk(root);
