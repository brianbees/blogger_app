import { formatInTimeZone } from 'date-fns-tz';

/**
 * Compute dayKey using Europe/London timezone
 * This must be used for all snippet grouping
 */
export function getDayKey(date) {
  return formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd');
}

/**
 * Format timestamp for display
 */
export function formatTime(date) {
  return formatInTimeZone(date, 'Europe/London', 'HH:mm:ss');
}
