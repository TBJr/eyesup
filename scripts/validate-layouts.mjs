#!/usr/bin/env node
// Validates every layout file in packages/layouts/*.json against the rules in
// docs/layout-format.md. Zero dependencies: Node 18+ only.
//
// Usage: node scripts/validate-layouts.mjs [layouts-dir]
// Exit code 0 = all layouts valid, 1 = at least one problem.

import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? 'packages/layouts');
const FINGERS = new Set(['L1', 'L2', 'L3', 'L4', 'R1', 'R2', 'R3', 'R4', 'T']);
const HOME_FINGERS = ['L4', 'L3', 'L2', 'L1', 'R1', 'R2', 'R3', 'R4'];
const ID = /^[a-z]+(-[a-z0-9]+)+$/;

let failures = 0;

for (const file of readdirSync(dir)
  .filter((f) => f.endsWith('.json') && f !== 'package.json' && ID.test(f.replace(/\.json$/, '')))
  .sort()) {
  const errors = [];
  let layout;
  try {
    layout = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch (e) {
    console.error(`✗ ${file}: not valid JSON (${e.message})`);
    failures += 1;
    continue;
  }

  if (!ID.test(layout.id ?? '')) errors.push(`id "${layout.id}" must look like "qwerty-us"`);
  if (`${layout.id}.json` !== file) errors.push(`file name must be ${layout.id}.json`);
  for (const field of ['name', 'language', 'standard', 'fingerprint', 'keys', 'learnOrder']) {
    if (layout[field] == null) errors.push(`missing "${field}"`);
  }
  if (!['ANSI', 'ISO', 'JIS'].includes(layout.standard)) errors.push(`standard must be ANSI, ISO or JIS`);

  const byCode = new Map();
  for (const key of layout.keys ?? []) {
    if (byCode.has(key.code)) errors.push(`key ${key.code} listed twice`);
    byCode.set(key.code, key);
    if (!FINGERS.has(key.finger)) errors.push(`key ${key.code} has unknown finger "${key.finger}"`);
    if (!Number.isInteger(key.row) || key.row < 0 || key.row > 4) errors.push(`key ${key.code} row must be 0–4`);
    if (!(key.width > 0)) errors.push(`key ${key.code} needs a positive width`);
  }

  // Each of the eight fingers has exactly one home key, and only F/J-position keys carry bumps.
  const homes = [...byCode.values()].filter((k) => k.home);
  for (const finger of HOME_FINGERS) {
    const n = homes.filter((k) => k.finger === finger).length;
    if (n !== 1) errors.push(`finger ${finger} must have exactly one home key (has ${n})`);
  }
  const bumps = [...byCode.values()].filter((k) => k.bump).map((k) => k.code).sort();
  if (bumps.join() !== 'KeyF,KeyJ') errors.push(`bumps must be on KeyF and KeyJ (found ${bumps.join() || 'none'})`);

  // Fingerprint keys exist and produce the stated characters.
  for (const [code, ch] of Object.entries(layout.fingerprint ?? {})) {
    const key = byCode.get(code);
    if (!key) errors.push(`fingerprint key ${code} is not in keys`);
    else if (key.base !== ch) errors.push(`fingerprint ${code} says "${ch}" but key base is "${key.base}"`);
  }

  // Every learnable key appears exactly once in learnOrder; nothing else does.
  const seen = new Map();
  (layout.learnOrder ?? []).forEach((group, i) => {
    if (!Array.isArray(group) || group.length === 0) errors.push(`learnOrder group ${i + 1} is empty`);
    for (const code of group ?? []) {
      if (!byCode.has(code)) errors.push(`learnOrder group ${i + 1} names unknown key ${code}`);
      else if (byCode.get(code).learn === false) errors.push(`learnOrder group ${i + 1} names ${code}, which is marked learn: false`);
      seen.set(code, (seen.get(code) ?? 0) + 1);
    }
  });
  for (const key of byCode.values()) {
    if (key.learn === false) continue;
    const n = seen.get(key.code) ?? 0;
    if (n !== 1) errors.push(`key ${key.code} appears ${n} times in learnOrder (must be exactly once)`);
  }
  const first = layout.learnOrder?.[0] ?? [];
  if (!first.includes('KeyF') || !first.includes('KeyJ')) errors.push('the first learnOrder group must contain KeyF and KeyJ');

  // Dead keys referenced by keys must be defined.
  for (const key of byCode.values()) {
    for (const value of [key.base, key.shift, key.altGr]) {
      if (typeof value === 'string' && value.startsWith('Dead:')) {
        const accent = value.slice(5);
        if (!layout.deadKeys?.[accent]) errors.push(`key ${key.code} uses dead key "${accent}" with no deadKeys entry`);
      }
    }
  }

  if (errors.length) {
    failures += 1;
    console.error(`✗ ${file}`);
    for (const e of errors) console.error(`    ${e}`);
  } else {
    const learnable = [...byCode.values()].filter((k) => k.learn !== false).length;
    console.log(`✓ ${file}: ${byCode.size} keys, ${learnable} learnable in ${layout.learnOrder.length} groups`);
  }
}

process.exit(failures ? 1 : 0);
