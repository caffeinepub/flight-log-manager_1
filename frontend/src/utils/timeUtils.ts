/**
 * Utility functions for time operations in the Flight Log Manager
 */

/**
 * Parse HH:MM string to total minutes
 */
export function parseTimeToMinutes(time: string): number {
  const parts = time.split(':');
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

/**
 * Calculate duration in minutes between two HH:MM times
 */
export function calcDurationMinutes(takeoff: string, landing: string): number {
  const t1 = parseTimeToMinutes(takeoff);
  const t2 = parseTimeToMinutes(landing);
  if (t2 <= t1) return 0;
  return t2 - t1;
}

/**
 * Format minutes to HH:MM string
 */
export function formatMinutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

/**
 * Format bigint duration (in minutes stored as bigint) to HH:MM
 */
export function formatDuration(durationMinutes: bigint): string {
  const mins = Number(durationMinutes);
  return formatMinutesToHHMM(mins);
}

/**
 * Convert JavaScript Date to nanosecond bigint timestamp
 */
export function dateToNanoseconds(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

/**
 * Convert nanosecond bigint timestamp to JavaScript Date
 */
export function nanosecondsToDate(ns: bigint): Date {
  return new Date(Number(ns / BigInt(1_000_000)));
}

/**
 * Format a nanosecond bigint timestamp to a readable date string (YYYY-MM-DD)
 */
export function formatDate(ns: bigint): string {
  const date = nanosecondsToDate(ns);
  return date.toISOString().split('T')[0];
}

/**
 * Format a nanosecond bigint timestamp to a readable date string (e.g. "Feb 26, 2026")
 */
export function formatDateLong(ns: bigint): string {
  const date = nanosecondsToDate(ns);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current month as YYYY-MM string
 */
export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Validate HH:MM time format
 */
export function isValidTime(time: string): boolean {
  const regex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
}

/**
 * Validate YYYY-MM-DD date format
 */
export function isValidDate(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Format total hours from minutes bigint for display (e.g. "12h 30m")
 */
export function formatHoursFromMinutes(totalMinutes: bigint): string {
  const mins = Number(totalMinutes);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
