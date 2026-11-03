import { crossoverGap } from './metrics.js';

export interface CrossoverProjection {
  /** Sessions from now until the fitted line reaches day-1 sighted WPM; 0 if crossed; null if no progress. */
  readonly projectedSessionsFromNow: number | null;
  /** Latest blind − day-1 sighted (same as crossoverGap). */
  readonly gap: number;
  readonly crossed: boolean;
}

/**
 * Linear regression of blind WPM vs session index; project when the line reaches
 * day-1 sighted WPM (§02 crossover plan / EU-031).
 */
export function projectCrossoverSession(
  day1SightedWpm: number,
  blindWpmsLastN: readonly number[],
): CrossoverProjection {
  const latest =
    blindWpmsLastN.length > 0
      ? blindWpmsLastN[blindWpmsLastN.length - 1]!
      : 0;
  const gap = crossoverGap(latest, day1SightedWpm);
  const crossed = gap >= 0;

  if (crossed) {
    return { projectedSessionsFromNow: 0, gap, crossed: true };
  }

  const n = blindWpmsLastN.length;
  if (n < 2) {
    return { projectedSessionsFromNow: null, gap, crossed: false };
  }

  // Ordinary least squares: x = 0..n-1, y = blind WPM.
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i += 1) {
    const x = i;
    const y = blindWpmsLastN[i]!;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) {
    return { projectedSessionsFromNow: null, gap, crossed: false };
  }
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  if (slope <= 0) {
    return { projectedSessionsFromNow: null, gap, crossed: false };
  }

  const xAtTarget = (day1SightedWpm - intercept) / slope;
  const fromNow = xAtTarget - (n - 1);
  const projectedSessionsFromNow = Math.max(0, Math.ceil(fromNow));

  return { projectedSessionsFromNow, gap, crossed: false };
}
