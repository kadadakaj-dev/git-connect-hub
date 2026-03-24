import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TimeSlot } from '@/types/booking';
import { format } from 'date-fns';

interface TimeSlotConfig {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface BookingRecord {
  time_slot: string;
  booking_duration: number;
}

/**
 * Calculate the booking duration in minutes based on service duration.
 * Rounds up to the nearest 30-minute slot.
 */
export function getBookingDuration(serviceDurationMinutes: number): number {
  return Math.ceil(serviceDurationMinutes / 30) * 30;
}

function generateSlotsFromConfig(
  config: TimeSlotConfig,
  allSlotTimes: string[],
  bookings: BookingRecord[],
  totalCapacity: number,
  requiredSlots: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [startHour, startMin] = config.start_time.split(':').map(Number);
  const [endHour, endMin] = config.end_time.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

    // Count how many employees are occupied at this time slot
    // A booking at time T with duration D occupies slots T, T+30, T+60, ... T+D-30
    let occupiedCount = 0;
    for (const b of bookings) {
      const [bH, bM] = b.time_slot.split(':').map(Number);
      const bookingStartMin = bH * 60 + bM;
      const bookingEndMin = bookingStartMin + (b.booking_duration || 30);
      const slotMin = currentHour * 60 + currentMin;
      if (slotMin >= bookingStartMin && slotMin < bookingEndMin) {
        occupiedCount++;
      }
    }

    // For multi-slot services, check if all consecutive slots are available
    let canBook = occupiedCount < totalCapacity;
    if (canBook && requiredSlots > 1) {
      // Check that the next (requiredSlots - 1) slots also exist and are available
      const slotMinutes = currentHour * 60 + currentMin;
      for (let i = 1; i < requiredSlots; i++) {
        const nextMin = slotMinutes + i * 30;
        const nextTimeStr = `${String(Math.floor(nextMin / 60)).padStart(2, '0')}:${String(nextMin % 60).padStart(2, '0')}`;
        // Check the next slot exists in the schedule
        if (!allSlotTimes.includes(nextTimeStr)) {
          canBook = false;
          break;
        }
        // Check occupancy of the next slot
        let nextOccupied = 0;
        for (const b of bookings) {
          const [bH, bM] = b.time_slot.split(':').map(Number);
          const bookingStartMin = bH * 60 + bM;
          const bookingEndMin = bookingStartMin + (b.booking_duration || 30);
          if (nextMin >= bookingStartMin && nextMin < bookingEndMin) {
            nextOccupied++;
          }
        }
        if (nextOccupied >= totalCapacity) {
          canBook = false;
          break;
        }
      }
    }

    slots.push({
      time: timeString,
      available: canBook,
      bookedCount: occupiedCount,
      totalCapacity,
    });

    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour += 1;
    }
  }

  return slots;
}

/**
 * Get all possible slot times from configs (used for consecutive slot validation).
 */
function getAllSlotTimes(configs: TimeSlotConfig[]): string[] {
  const times: Set<string> = new Set();
  for (const config of configs) {
    const [startHour, startMin] = config.start_time.split(':').map(Number);
    const [endHour, endMin] = config.end_time.split(':').map(Number);
    let h = startHour, m = startMin;
    while (h < endHour || (h === endHour && m < endMin)) {
      times.add(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      m += 30;
      if (m >= 60) { m = 0; h++; }
    }
  }
  return Array.from(times).sort();
}

export function useTimeSlots(selectedDate: Date | null, serviceDuration: number = 30) {
  const requiredSlots = Math.ceil(serviceDuration / 30);

  return useQuery({
    queryKey: ['timeSlots', selectedDate?.toISOString(), serviceDuration],
    queryFn: async (): Promise<TimeSlot[]> => {
      if (!selectedDate) return [];

      const now = new Date();
      const minBookableTime = new Date(now.getTime() + 36 * 60 * 60 * 1000);

      const dayOfWeek = selectedDate.getDay();
      const dateString = format(selectedDate, 'yyyy-MM-dd');

      // Check if date is blocked
      const { data: blockedDate } = await supabase
        .from('blocked_dates')
        .select('id')
        .eq('date', dateString)
        .maybeSingle();

      if (blockedDate) {
        return [];
      }

      // Fetch config, bookings, and active employees count in parallel
      const [configRes, bookingsRes, employeesRes] = await Promise.all([
        supabase
          .from('time_slots_config')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true),
        supabase
          .from('bookings')
          .select('time_slot, booking_duration')
          .eq('date', dateString)
          .neq('status', 'cancelled'),
        supabase
          .from('employees_public')
          .select('id'),
      ]);

      if (configRes.error) throw configRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (employeesRes.error) throw employeesRes.error;

      const configData = configRes.data;
      if (!configData || configData.length === 0) return [];

      const totalCapacity = Math.max(employeesRes.data?.length || 1, 1);
      const bookings: BookingRecord[] = (bookingsRes.data || []).map((b: any) => ({
        time_slot: b.time_slot,
        booking_duration: b.booking_duration || 30,
      }));

      const allSlotTimes = getAllSlotTimes(configData);

      // Generate all slots
      let allSlots: TimeSlot[] = [];
      for (const config of configData) {
        const slots = generateSlotsFromConfig(config, allSlotTimes, bookings, totalCapacity, requiredSlots);
        allSlots = [...allSlots, ...slots];
      }

      allSlots.sort((a, b) => a.time.localeCompare(b.time));

      // Remove duplicates
      const uniqueSlots = allSlots.filter(
        (slot, index, self) => self.findIndex((s) => s.time === slot.time) === index
      );

      // Filter out slots within the 36h lead time window
      const filtered = uniqueSlots.map((slot) => {
        const [h, m] = slot.time.split(':').map(Number);
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(h, m, 0, 0);
        if (slotDateTime < minBookableTime) {
          return { ...slot, available: false };
        }
        return slot;
      });

      return filtered;
    },
    enabled: !!selectedDate,
  });
}
