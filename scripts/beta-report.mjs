#!/usr/bin/env node
/**
 * EU-052 — zero-dependency beta report from learner JSON exports.
 * Usage: node scripts/beta-report.mjs <folder-of-exports>
 * Prints Gate B (and Gate C supporting) numbers only — never typed text or keystroke logs.
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
const DAY_MS = 86_400_000;

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

  const created = baseline?.takenAt ? Date.parse(baseline.takenAt) : NaN;
  const lastSession = sessions.at(-1)?.endedAt ?? sessions.at(-1)?.startedAt;
  const lastMs = lastSession ? Date.parse(lastSession) : NaN;
  const day30Return =
    Number.isFinite(created) &&
    Number.isFinite(lastMs) &&
    lastMs - created >= 30 * DAY_MS;

  const totalPresses = keyStats.reduce((n, k) => n + (k.presses ?? 0), 0);
  const l3Presses = keyStats
    .filter((k) => (k.guideLevel ?? 0) >= 3)
    .reduce((n, k) => n + (k.presses ?? 0), 0);
  const eyesUpShare = totalPresses > 0 ? l3Presses / totalPresses : 0;

  const day1Sighted = baseline?.sightedWpm ?? null;
  const blindSessions = sessions.filter((s) => s.blindCheck && s.netWpm != null);
  const latestBlind = blindSessions.at(-1)?.netWpm ?? null;
  const crossedOver =
    day1Sighted != null && latestBlind != null && latestBlind >= day1Sighted;

  learners.push({
    file,
    placedTrack: baseline?.placedTrack ?? null,
    activeTrack: raw.profile?.track ?? null,
    sessionCount: sessions.length,
    homeBlindReady,
    day1SightedWpm: day1Sighted,
    latestNetWpm: sessions.at(-1)?.netWpm ?? null,
    day30Return,
    eyesUpShare,
    crossedOver,
  });
}

const n = learners.length;
const homeReady = learners.filter((l) => l.homeBlindReady).length;
const gateB = n === 0 ? 0 : homeReady / n;
const day30 = learners.filter((l) => l.day30Return).length;
const eyesUpMean =
  n === 0 ? 0 : learners.reduce((s, l) => s + l.eyesUpShare, 0) / n;
const crossover = learners.filter((l) => l.crossedOver).length;

console.log('EyesUp beta report (EU-052 / Gate B · Gate C support)');
console.log(`learners: ${n}`);
console.log(`home_row_blind_ready_share: ${(gateB * 100).toFixed(1)}%`);
console.log(`gate_b_pass_half_cohort: ${gateB >= 0.5 ? 'YES' : 'NO'}`);
console.log(`day30_return_share: ${n === 0 ? '0.0' : ((day30 / n) * 100).toFixed(1)}%`);
console.log(`eyes_up_rate_mean: ${(eyesUpMean * 100).toFixed(1)}%`);
console.log(`crossover_share: ${n === 0 ? '0.0' : ((crossover / n) * 100).toFixed(1)}%`);
console.log(
  `gate_c_targets_hint: day30>=25% eyes_up>=40% crossover>=50% (plan §01)`,
);
console.log('per_learner:');
for (const l of learners) {
  console.log(
    `  - sessions=${l.sessionCount} placed=${l.placedTrack} active=${l.activeTrack} homeBlindReady=${l.homeBlindReady} day1Sighted=${l.day1SightedWpm} latestNet=${l.latestNetWpm} day30=${l.day30Return} eyesUp=${(l.eyesUpShare * 100).toFixed(0)}% crossed=${l.crossedOver}`,
  );
}
