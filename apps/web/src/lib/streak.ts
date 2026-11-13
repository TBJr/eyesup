/** One rest day per week does not break the streak (EU-027 / FR-25). */

export interface StreakState {
  streakDays: number;
  lastPracticeDate: string | null;
  restDaysUsedThisWeek: number;
  weekStartIso: string | null;
}

function mondayOf(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  const ms = Date.parse(`${b}T12:00:00.000Z`) - Date.parse(`${a}T12:00:00.000Z`);
  return Math.round(ms / 86_400_000);
}

/**
 * Update streak after a practice day (`today` = YYYY-MM-DD).
 */
export function applyPracticeDay(state: StreakState, today: string): StreakState {
  const weekStart = mondayOf(today);
  let restUsed = state.restDaysUsedThisWeek;
  if (state.weekStartIso !== weekStart) {
    restUsed = 0;
  }

  if (state.lastPracticeDate === today) {
    return {
      ...state,
      weekStartIso: weekStart,
      restDaysUsedThisWeek: restUsed,
    };
  }

  if (!state.lastPracticeDate) {
    return {
      streakDays: 1,
      lastPracticeDate: today,
      restDaysUsedThisWeek: restUsed,
      weekStartIso: weekStart,
    };
  }

  const gap = dayDiff(state.lastPracticeDate, today);
  if (gap <= 1) {
    return {
      streakDays: state.streakDays + (gap === 1 ? 1 : 0),
      lastPracticeDate: today,
      restDaysUsedThisWeek: restUsed,
      weekStartIso: weekStart,
    };
  }

  if (gap === 2 && restUsed < 1) {
    return {
      streakDays: state.streakDays + 1,
      lastPracticeDate: today,
      restDaysUsedThisWeek: restUsed + 1,
      weekStartIso: weekStart,
    };
  }

  return {
    streakDays: 1,
    lastPracticeDate: today,
    restDaysUsedThisWeek: restUsed,
    weekStartIso: weekStart,
  };
}
