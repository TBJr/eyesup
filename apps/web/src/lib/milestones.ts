import { STORAGE_SCHEMA_VERSION, type MilestoneRecord, type StorageAdapter } from '../storage/types.js';

/** Stable milestone ids (FR-24 / §02) — never include typed text in detail. */
export const MILESTONE = {
  firstBlindLine: 'first_blind_line',
  allLettersUnlocked: 'all_letters_unlocked',
  crossoverReached: 'crossover_reached',
  first30WpmBlind: 'first_30_wpm_blind',
} as const;

export type MilestoneId = (typeof MILESTONE)[keyof typeof MILESTONE];

/** Record a milestone once; no-ops if already present. */
export async function ensureMilestone(
  storage: StorageAdapter,
  id: MilestoneId,
  detail: Record<string, unknown> = {},
): Promise<boolean> {
  const existing = await storage.listMilestones();
  if (existing.some((m) => m.id === id)) return false;
  const record: MilestoneRecord = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    id,
    reachedAt: new Date().toISOString(),
    detail,
  };
  await storage.putMilestone(record);
  return true;
}
