/**
 * Date utilities with Europe/Bucharest timezone support
 */

const TIMEZONE = 'Europe/Bucharest';

export interface DateRange {
  from: Date;
  to: Date;
  tz: string;
}

/**
 * Parse and normalize date range with Bucharest timezone
 * Default to WTD (Week-To-Date) if not provided
 */
export function normalizeDateRange(from?: string, to?: string): DateRange {
  const now = new Date();
  const toDate = to ? parseDate(to) : now;
  
  let fromDate: Date;
  if (from) {
    fromDate = parseDate(from);
  } else {
    // Default: WTD (start of current week, Monday)
    fromDate = getStartOfWeek(now);
  }

  // Normalize to cover the full days so end-of-day timestamps are included
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);

  return {
    from: fromDate,
    to: toDate,
    tz: TIMEZONE,
  };
}

/**
 * Parse ISO date string to Date object
 */
function parseDate(dateStr: string): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return date;
}

/**
 * Get start of week (Monday) in Bucharest timezone
 */
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday (0)
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get start of month in Bucharest timezone
 */
export function getStartOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get number of days in current month
 */
export function getDaysInCurrentMonth(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get number of elapsed days in current month
 */
export function getElapsedDaysInMonth(): number {
  const now = new Date();
  return now.getDate();
}

/**
 * Calculate number of days between two dates (inclusive)
 */
export function getDaysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / msPerDay) + 1; // +1 to make it inclusive
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
