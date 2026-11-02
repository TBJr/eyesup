#!/usr/bin/env node
// Fails when gzipped JavaScript in apps/web/dist exceeds 200 KB,
// not counting content packs. Zero dependencies (node:zlib).

import { createGzip } from 'node:zlib';
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';

const MAX_BYTES = 200 * 1024;
const dist = resolve('apps/web/dist');

if (!existsSync(dist)) {
  console.error(`size-check: missing ${dist}; run pnpm build first`);
  process.exit(1);
}

/** @param {string} dir @param {string[]} out */
function collectJs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      // Content packs live under assets/content or similar — skip obvious content dirs.
      if (name === 'content' || name === 'packs') continue;
      collectJs(path, out);
    } else if (name.endsWith('.js') || name.endsWith('.mjs')) {
      out.push(path);
    }
  }
  return out;
}

/** @param {string} file */
async function gzipSize(file) {
  let size = 0;
  const counter = new Writable({
    write(chunk, _enc, cb) {
      size += chunk.length;
      cb();
    },
  });
  await pipeline(createReadStream(file), createGzip({ level: 9 }), counter);
  return size;
}

const files = collectJs(dist);
if (files.length === 0) {
  console.error('size-check: no JavaScript files found in apps/web/dist');
  process.exit(1);
}

let total = 0;
for (const file of files) {
  const size = await gzipSize(file);
  total += size;
  console.log(`${(size / 1024).toFixed(1)} KB  ${file}`);
}

console.log(`Total gzipped JS: ${(total / 1024).toFixed(1)} KB (limit ${(MAX_BYTES / 1024).toFixed(0)} KB)`);
if (total > MAX_BYTES) {
  console.error('size-check: budget exceeded');
  process.exit(1);
}
