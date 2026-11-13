/**
 * Desktop reminder bridge (EU-047 / FR-34).
 * Invokes the Tauri stub; no-op outside the desktop shell.
 */

import { detectIsTauri, invokeCmd } from '../storage/tauriBridge.js';

export async function showReminderNotification(title: string, body: string): Promise<void> {
  if (!detectIsTauri()) {
    return;
  }
  await invokeCmd<void>('show_reminder_notification', { title, body });
}

/** Alias used by App.svelte. */
export const showDesktopReminder = showReminderNotification;
