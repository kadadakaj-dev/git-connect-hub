/**
 * Calculate the booking duration in minutes based on service duration.
 * No buffer: booking duration equals the real service duration.
 */
export function getBookingDuration(serviceDurationMinutes: number): number {
  return serviceDurationMinutes;
}
