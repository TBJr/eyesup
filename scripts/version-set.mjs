#!/usr/bin/env node
/**
 * Set shared SemVer across web package.json, desktop package.json,
 * apps/desktop/src-tauri/tauri.conf.json and Cargo.toml (release runbook).
 * Usage: node scripts/version-set.mjs 1.2.3
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: node scripts/version-set.mjs X.Y.Z');
  process.exit(2);
}

const root = new URL('..', import.meta.url).pathname;

function patchJson(rel, mutator) {
  const path = join(root, rel);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  mutator(data);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

patchJson('apps/web/package.json', (d) => {
  d.version = version;
});
patchJson('apps/desktop/package.json', (d) => {
  d.version = version;
});
patchJson('apps/desktop/src-tauri/tauri.conf.json', (d) => {
  d.version = version;
});

const cargoPath = join(root, 'apps/desktop/src-tauri/Cargo.toml');
const cargo = readFileSync(cargoPath, 'utf8').replace(
  /^version = "[^"]+"/m,
  `version = "${version}"`,
);
writeFileSync(cargoPath, cargo);
console.log(`version set to ${version}`);
