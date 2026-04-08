/**
 * Calculate the booking duration in minutes based on service duration.
 * Rounds up to the nearest 30-minute slot.
 */
export function getBookingDuration(serviceDurationMinutes: number): number {
  return Math.ceil(serviceDurationMinutes / 30) * 30;
}
