/**
 * Ghost race helpers (EU-038 / FR-26).
 * Timeline of caret positions over ms; best run kept in memory.
 */

export interface GhostSample {
  readonly ms: number;
  readonly caret: number;
}

export interface GhostTimeline {
  readonly textHash: string;
  readonly samples: readonly GhostSample[];
  /** Wall duration of the run (ms); used to decide "best". */
  readonly durationMs: number;
}

/** Stable short hash of practice text for best-ghost keys (not cryptographic). */
export function hashPracticeText(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Alias used by App.svelte. */
export const hashText = hashPracticeText;

/**
 * Append a caret sample. Ignores out-of-order ms and duplicate caret at the same ms.
 * Mutates and returns `samples` for convenient chaining during a line.
 */
export function recordGhostSample(
  samples: GhostSample[],
  ms: number,
  caret: number,
): GhostSample[] {
  if (!Number.isFinite(ms) || ms < 0 || !Number.isFinite(caret) || caret < 0) {
    return samples;
  }
  const last = samples[samples.length - 1];
  if (last && ms < last.ms) {
    return samples;
  }
  if (last && last.ms === ms && last.caret === caret) {
    return samples;
  }
  samples.push({ ms, caret: Math.floor(caret) });
  return samples;
}

/**
 * Build a timeline from samples collected during a line play.
 * Ensures a sample at ms 0 caret 0 when the list is empty or starts later.
 */
export function buildGhostFromLinePlay(input: {
  textHash: string;
  samples: readonly GhostSample[];
  durationMs?: number;
}): GhostTimeline {
  const sorted = [...input.samples]
    .filter((s) => Number.isFinite(s.ms) && s.ms >= 0 && Number.isFinite(s.caret) && s.caret >= 0)
    .sort((a, b) => a.ms - b.ms || a.caret - b.caret);

  const samples: GhostSample[] =
    sorted.length === 0 || sorted[0]!.ms > 0
      ? [{ ms: 0, caret: 0 }, ...sorted]
      : sorted;

  const lastMs = samples[samples.length - 1]!.ms;
  const durationMs =
    input.durationMs != null && input.durationMs >= lastMs ? input.durationMs : lastMs;

  return {
    textHash: input.textHash,
    samples,
    durationMs,
  };
}

/**
 * Build from caret samples that use `t` (App convention) or `ms`.
 */
export function buildGhostFromCarets(
  text: string,
  samples: ReadonlyArray<{ t?: number; ms?: number; caret: number }>,
  durationMs?: number,
): GhostTimeline {
  const normalized: GhostSample[] = samples.map((s) => ({
    ms: s.ms ?? s.t ?? 0,
    caret: s.caret,
  }));
  return buildGhostFromLinePlay({
    textHash: hashPracticeText(text),
    samples: normalized,
    ...(durationMs != null ? { durationMs } : {}),
  });
}

/**
 * Step caret for a ghost at `elapsedMs` (last sample with ms <= elapsed).
 * Clamps before the first / after the last sample.
 */
export function ghostCaretAt(ghost: GhostTimeline, elapsedMs: number): number {
  if (ghost.samples.length === 0) return 0;
  if (elapsedMs <= ghost.samples[0]!.ms) return ghost.samples[0]!.caret;

  let caret = ghost.samples[0]!.caret;
  for (const sample of ghost.samples) {
    if (sample.ms > elapsedMs) break;
    caret = sample.caret;
  }
  return caret;
}

/** In-memory best-ghost store (per textHash). Replace with storage in App later. */
const bestByHash = new Map<string, GhostTimeline>();

export function clearBestGhostStore(): void {
  bestByHash.clear();
}

export function getBestGhost(textHash: string): GhostTimeline | undefined {
  return bestByHash.get(textHash);
}

/** Alias: look up best ghost by practice text. */
export function bestGhostFor(text: string): GhostTimeline | undefined {
  return getBestGhost(hashPracticeText(text));
}

/**
 * Keep the faster (lower durationMs) run for this textHash.
 * Returns true when the store was updated.
 */
export function maybeSaveBestGhost(ghost: GhostTimeline): boolean {
  const prev = bestByHash.get(ghost.textHash);
  if (!prev || ghost.durationMs < prev.durationMs) {
    bestByHash.set(ghost.textHash, ghost);
    return true;
  }
  return false;
}

/** Alias used by App.svelte. */
export const rememberBestGhost = maybeSaveBestGhost;

/** Snapshot of the in-memory store (for tests / future persistence). */
export function listBestGhosts(): GhostTimeline[] {
  return [...bestByHash.values()];
}
