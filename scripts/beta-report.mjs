#!/usr/bin/env node
/**
 * EU-052 — zero-dependency beta report from learner JSON exports.
 * Usage: node scripts/beta-report.mjs <folder-of-exports>
 * Prints Gate B numbers only — never typed text or keystroke logs.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/beta-report.mjs <folder>');
  process.exit(2);
}

const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
const learners = [];

for (const file of files) {
  const raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const baseline = raw.baseline ?? null;
  const sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
  const keyStats = Array.isArray(raw.keyStats) ? raw.keyStats : [];
  const homeRowCodes = new Set(['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon']);
  const homeKeys = keyStats.filter((k) => homeRowCodes.has(k.code));
  const homeBlindReady =
    homeKeys.length > 0 &&
    homeKeys.every((k) => (k.accuracy ?? 0) >= 0.95 && (k.guideLevel ?? 0) >= 2);
  learners.push({
    file,
    placedTrack: baseline?.placedTrack ?? null,
    activeTrack: raw.profile?.track ?? null,
    sessionCount: sessions.length,
    homeBlindReady,
    day1SightedWpm: baseline?.sightedWpm ?? null,
    latestNetWpm: sessions.at(-1)?.netWpm ?? null,
  });
}

const n = learners.length;
const homeReady = learners.filter((l) => l.homeBlindReady).length;
const gateB = n === 0 ? 0 : homeReady / n;

console.log('EyesUp beta report (EU-052 / Gate B)');
console.log(`learners: ${n}`);
console.log(`home_row_blind_ready_share: ${(gateB * 100).toFixed(1)}%`);
console.log(`gate_b_pass_half_cohort: ${gateB >= 0.5 ? 'YES' : 'NO'}`);
console.log('per_learner:');
for (const l of learners) {
  console.log(
    `  - sessions=${l.sessionCount} placed=${l.placedTrack} active=${l.activeTrack} homeBlindReady=${l.homeBlindReady} day1Sighted=${l.day1SightedWpm} latestNet=${l.latestNetWpm}`,
  );
}
