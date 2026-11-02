#!/usr/bin/env node
// Builds an order-3 letter model with word-start (^) and word-end ($) markers.
// Usage: node scripts/build-letter-model.mjs <words.txt> <out.json>
// Zero dependencies.

import { readFileSync, writeFileSync } from 'node:fs';

const START = '^';
const END = '$';
const ORDER = 3;

const inPath = process.argv[2];
const outPath = process.argv[3];
if (!inPath || !outPath) {
  console.error('Usage: node scripts/build-letter-model.mjs <words.txt> <out.json>');
  process.exit(1);
}

const words = readFileSync(inPath, 'utf8')
  .split(/\r?\n/)
  .map((w) => w.trim().toLowerCase())
  .filter((w) => w && !w.startsWith('#') && /^[a-z]+$/.test(w));

/** @type {Record<string, Record<string, number>>} */
const counts = Object.create(null);

/** @param {string} ctx @param {string} next */
function bump(ctx, next) {
  if (!counts[ctx]) counts[ctx] = Object.create(null);
  counts[ctx][next] = (counts[ctx][next] ?? 0) + 1;
}

for (const word of words) {
  const padded = START.repeat(ORDER) + word + END;
  for (let i = ORDER; i < padded.length; i += 1) {
    const ctx = padded.slice(i - ORDER, i);
    bump(ctx, padded[i] ?? END);
  }
}

const model = {
  order: ORDER,
  start: START,
  end: END,
  wordCount: words.length,
  counts,
};

writeFileSync(outPath, `${JSON.stringify(model)}\n`);
console.log(`Wrote ${outPath} from ${words.length} words`);
