import { DateTime } from 'luxon';

const TIMEZONE = 'Europe/Bratislava';

/**
 * Helper to get current time in Europe/Bratislava timezone
 */
export function getBratislavaNow(): DateTime {
  return DateTime.now().setZone(TIMEZONE);
}

/**
 * Helper to format a native Date and time string into a Bratislava DateTime
 */
export function parseBratislavaDate(date: Date, timeSlot: string): DateTime {
  const [hours, minutes] = timeSlot.split(':').map(Number);

  // Convert the instant to Bratislava zone first so that the calendar date
  // (year/month/day) is correct regardless of the runner/browser timezone.
  // Then apply the timeSlot (expressed in Bratislava time) in-zone.
  return DateTime.fromJSDate(date, { zone: TIMEZONE }).set({
    hour: hours,
    minute: minutes,
    second: 0,
    millisecond: 0,
  });
}

/**
 * Validates if the given booking date and time slot is at least 36 hours from the current Bratislava time.
 * @param date The selected booking date
 * @param timeSlot The selected time slot in "HH:mm" format (must be in Europe/Bratislava time)
 * @returns { allowed: boolean; error?: string }
 */
export function validateBookingLeadTime(
  date: Date,
  timeSlot: string
): { allowed: boolean; error?: string } {
  const targetDateTime = parseBratislavaDate(date, timeSlot);
  const now = getBratislavaNow();

  const threshold = now.plus({ hours: 36 });

  // Reject only if strictly before now + 36h; allow if equal or after
  if (targetDateTime.toMillis() < threshold.toMillis()) {
    return { allowed: false, error: 'Advance booking required (min 36h)' };
  }

  return { allowed: true };
}
