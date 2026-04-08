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
  
  // We want the specific Day/Month/Year from the picker to be interpreted 
  // as that day in Bratislava time, regardless of where the server/browser is.
  return DateTime.fromObject({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: hours,
    minute: minutes,
    second: 0,
    millisecond: 0
  }, { zone: TIMEZONE });
}

/**
 * Validates if the given booking date and time slot is at least 36 hours from the current Bratislava time.
 * @param date The selected booking date
 * @param timeSlot The selected time slot in "HH:mm" format
 * @returns { allowed: boolean; error?: string }
 */
export function validateBookingLeadTime(date: Date, timeSlot: string): { allowed: boolean; error?: string } {
  const targetDateTime = parseBratislavaDate(date, timeSlot);
  const now = getBratislavaNow();
  const leadTimeHours = 36;
  
  if (targetDateTime < now.plus({ hours: leadTimeHours })) {
    return { allowed: false, error: 'Advance booking required (min 36h)' };
  }
  
  return { allowed: true };
}
