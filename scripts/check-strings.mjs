#!/usr/bin/env node
// Fails when a .svelte template contains literal visible text instead of a
// lookup from packages/ui/strings/en.json. Zero dependencies.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve('.');
const svelteRoots = [resolve('apps/web/src'), resolve('packages/ui/src')].filter((p) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
});

/** @param {string} dir @param {string[]} out */
function collectSvelte(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) collectSvelte(path, out);
    else if (name.endsWith('.svelte')) out.push(path);
  }
  return out;
}

/** Strip balanced `{...}` expressions. */
function stripMustaches(input) {
  let out = '';
  let i = 0;
  while (i < input.length) {
    if (input[i] === '{') {
      let depth = 1;
      i += 1;
      while (i < input.length && depth > 0) {
        if (input[i] === '{') depth += 1;
        else if (input[i] === '}') depth -= 1;
        i += 1;
      }
      continue;
    }
    out += input[i];
    i += 1;
  }
  return out;
}

/**
 * Remove tags while respecting quoted attribute values and `{...}` expressions
 * so `>` inside onclick handlers does not end the tag early.
 * @param {string} source
 */
function stripTags(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    if (source[i] !== '<') {
      out += source[i];
      i += 1;
      continue;
    }
    i += 1; // skip <
    let quote = null;
    let brace = 0;
    while (i < source.length) {
      const ch = source[i];
      if (quote) {
        if (ch === quote) quote = null;
        i += 1;
        continue;
      }
      if (brace > 0) {
        if (ch === '{') brace += 1;
        else if (ch === '}') brace -= 1;
        i += 1;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        i += 1;
        continue;
      }
      if (ch === '{') {
        brace = 1;
        i += 1;
        continue;
      }
      if (ch === '>') {
        i += 1;
        break;
      }
      i += 1;
    }
    out += '\n';
  }
  return out;
}

/**
 * @param {string} source
 */
function findLiteralText(source) {
  const withoutBlocks = source
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const textOnly = stripMustaches(stripTags(withoutBlocks));
  const hits = [];
  for (const line of textOnly.split(/\n+/)) {
    const text = line.trim();
    if (!text) continue;
    if (/^[\d\s.,:;!?/\\|+\-*=#@$%^&()[\]{}'"`~]+$/.test(text)) continue;
    hits.push(text);
  }
  return hits;
}

let failed = false;
for (const base of svelteRoots) {
  for (const file of collectSvelte(base)) {
    const source = readFileSync(file, 'utf8');
    const hits = findLiteralText(source);
    if (hits.length) {
      failed = true;
      console.error(`${relative(root, file)}: literal visible text (use packages/ui/strings):`);
      for (const hit of hits) console.error(`  - ${JSON.stringify(hit)}`);
    }
  }
}

if (failed) process.exit(1);
console.log('check-strings: ok');
