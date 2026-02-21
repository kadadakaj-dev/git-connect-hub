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

function generateSlotsFromConfig(
  config: TimeSlotConfig,
  bookingCounts: Record<string, number>,
  totalCapacity: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [startHour, startMin] = config.start_time.split(':').map(Number);
  const [endHour, endMin] = config.end_time.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    const bookedCount = bookingCounts[timeString] || 0;
    slots.push({
      time: timeString,
      available: bookedCount < totalCapacity,
      bookedCount,
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

export function useTimeSlots(selectedDate: Date | null) {
  return useQuery({
    queryKey: ['timeSlots', selectedDate?.toISOString()],
    queryFn: async (): Promise<TimeSlot[]> => {
      if (!selectedDate) return [];

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
          .select('time_slot')
          .eq('date', dateString)
          .neq('status', 'cancelled'),
        supabase
          .from('employees')
          .select('id')
          .eq('is_active', true),
      ]);

      if (configRes.error) throw configRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (employeesRes.error) throw employeesRes.error;

      const configData = configRes.data;
      if (!configData || configData.length === 0) return [];

      const totalCapacity = Math.max(employeesRes.data?.length || 1, 1);

      // Count bookings per time slot
      const bookingCounts: Record<string, number> = {};
      for (const b of bookingsRes.data || []) {
        bookingCounts[b.time_slot] = (bookingCounts[b.time_slot] || 0) + 1;
      }

      // Generate all slots
      let allSlots: TimeSlot[] = [];
      for (const config of configData) {
        const slots = generateSlotsFromConfig(config, bookingCounts, totalCapacity);
        allSlots = [...allSlots, ...slots];
      }

      allSlots.sort((a, b) => a.time.localeCompare(b.time));

      // Remove duplicates
      const uniqueSlots = allSlots.filter(
        (slot, index, self) => self.findIndex((s) => s.time === slot.time) === index
      );

      return uniqueSlots;
    },
    enabled: !!selectedDate,
  });
}
