/**
 * Helper to get current time in Europe/Bratislava timezone
 */
export function getBratislavaNow(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Bratislava',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const dateObj: Record<string, string> = {};
  parts.forEach(({ type, value }) => {
    dateObj[type] = value;
  });
  
  return new Date(
    Number(dateObj.year),
    Number(dateObj.month) - 1,
    Number(dateObj.day),
    Number(dateObj.hour),
    Number(dateObj.minute),
    Number(dateObj.second)
  );
}

/**
 * Validates if the given booking date and time slot is at least 36 hours from the current Bratislava time.
 * @param date The selected booking date
 * @param timeSlot The selected time slot in "HH:mm" format
 * @returns { allowed: boolean; error?: string }
 */
export function validateBookingLeadTime(date: Date, timeSlot: string): { allowed: boolean; error?: string } {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  // Clone the date to avoid mutating the original
  const targetDateTime = new Date(date);
  targetDateTime.setHours(hours, minutes, 0, 0);
  
  const now = getBratislavaNow();
  const leadTimeMs = 36 * 60 * 60 * 1000;
  
  if (targetDateTime.getTime() < now.getTime() + leadTimeMs) {
    return { allowed: false, error: 'Advance booking required (min 36h)' };
  }
  
  return { allowed: true };
}
