import { describe, expect, it } from 'vitest';
import {
  formatReminderTime,
  parseReminderTime,
  shouldNotifyToday,
} from './reminders.js';

describe('reminders', () => {
  it('parseReminderTime accepts HH:MM and rejects junk', () => {
    expect(parseReminderTime('09:30')).toEqual({ hours: 9, minutes: 30 });
    expect(parseReminderTime('9:05')).toEqual({ hours: 9, minutes: 5 });
    expect(parseReminderTime('23:59')).toEqual({ hours: 23, minutes: 59 });
    expect(parseReminderTime(null)).toBeNull();
    expect(parseReminderTime('')).toBeNull();
    expect(parseReminderTime('24:00')).toBeNull();
    expect(parseReminderTime('9:5')).toBeNull();
    expect(parseReminderTime('abc')).toBeNull();
  });

  it('formatReminderTime zero-pads', () => {
    expect(formatReminderTime({ hours: 9, minutes: 5 })).toBe('09:05');
    expect(formatReminderTime({ hours: 18, minutes: 0 })).toBe('18:00');
  });

  it('shouldNotifyToday respects rest day and clock match', () => {
    const atNine = new Date(2026, 10, 13, 9, 30, 0, 0);
    expect(shouldNotifyToday(atNine, '09:30', false)).toBe(true);
    expect(shouldNotifyToday(atNine, '09:30', true)).toBe(false);
    expect(shouldNotifyToday(atNine, null, false)).toBe(false);
    expect(shouldNotifyToday(atNine, '09:31', false)).toBe(false);
  });
});
