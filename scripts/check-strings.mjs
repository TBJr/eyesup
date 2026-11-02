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

/**
 * Strip script/style blocks, then flag text nodes that look like user-visible copy.
 * Allows {expressions}, HTML comments, and whitespace-only text.
 * @param {string} source
 */
function findLiteralText(source) {
  const withoutBlocks = source
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const hits = [];
  const textRe = />([^<]+)</g;
  let match;
  while ((match = textRe.exec(withoutBlocks))) {
    const raw = match[1] ?? '';
    const text = raw.replace(/\{[^}]*\}/g, '').trim();
    if (!text) continue;
    // Ignore pure punctuation / digits used as layout chrome.
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
