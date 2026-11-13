/**
 * Daily reminder helpers (EU-047 / FR-34).
 * Off by default (null reminderTime); one nudge per day at HH:MM; none on rest days.
 */

export type ReminderTime = { readonly hours: number; readonly minutes: number };

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** True when value is a parseable `HH:MM` (leading zero optional on hours). */
export function isValidReminderTime(value: string | null | undefined): boolean {
  if (!value) return false;
  return TIME_RE.test(value.trim());
}

/** Parse `HH:MM` (24h). Returns null when empty or invalid. */
export function parseReminderTime(value: string | null | undefined): ReminderTime | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const m = TIME_RE.exec(trimmed);
  if (!m) return null;
  return { hours: Number(m[1]), minutes: Number(m[2]) };
}

/** Format a reminder time as zero-padded `HH:MM`. Also accepts (hours, minutes). */
export function formatReminderTime(
  timeOrHours: ReminderTime | number,
  minutes?: number,
): string {
  const hours =
    typeof timeOrHours === 'number' ? timeOrHours : timeOrHours.hours;
  const mins = typeof timeOrHours === 'number' ? (minutes ?? 0) : timeOrHours.minutes;
  const hh = String(Math.min(23, Math.max(0, Math.floor(hours)))).padStart(2, '0');
  const mm = String(Math.min(59, Math.max(0, Math.floor(mins)))).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Whether a reminder may fire for this local clock reading.
 * - false when `restDayUsed` (or `{ isRestDay: true }`)
 * - false when reminderTime is unset or invalid (feature off)
 * - true when local HH:MM equals the configured time
 *
 * App must still enforce "once per calendar day" (track last-notified date).
 */
export function shouldNotifyToday(
  now: Date,
  reminderTime: string | null | undefined,
  restDayUsed: boolean | { isRestDay?: boolean } = false,
): boolean {
  const isRest =
    typeof restDayUsed === 'boolean' ? restDayUsed : Boolean(restDayUsed.isRestDay);
  if (isRest) return false;
  const parsed = parseReminderTime(reminderTime);
  if (!parsed) return false;
  return now.getHours() === parsed.hours && now.getMinutes() === parsed.minutes;
}
