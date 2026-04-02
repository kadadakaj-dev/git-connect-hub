import { BookingRow } from "@/utils/supabase/client";

export function calculateOccupancyRate(
  bookings: BookingRow[],
  totalOpeningHours: number
) {
  if (totalOpeningHours <= 0) return 0;

  const bookedHours = bookings.reduce((sum, booking) => {
    if (booking.status === "cancelled") return sum;
    const start = new Date(booking.start_time).getTime();
    const end = new Date(booking.end_time).getTime();
    const hours = Math.max((end - start) / (1000 * 60 * 60), 0);
    return sum + hours;
  }, 0);

  return Math.min((bookedHours / totalOpeningHours) * 100, 100);
}
