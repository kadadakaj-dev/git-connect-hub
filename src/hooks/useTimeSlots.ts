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

function generateSlotsFromConfig(config: TimeSlotConfig, bookedSlots: string[]): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [startHour, startMin] = config.start_time.split(':').map(Number);
  const [endHour, endMin] = config.end_time.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push({
      time: timeString,
      available: !bookedSlots.includes(timeString),
    });

    // Increment by 30 minutes
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
        return []; // Date is blocked, no slots available
      }

      // Get time slot config for this day
      const { data: configData, error: configError } = await supabase
        .from('time_slots_config')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (configError) {
        console.error('Error fetching time slots config:', configError);
        throw configError;
      }

      if (!configData || configData.length === 0) {
        return []; // No configuration for this day
      }

      // Get already booked slots for this date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('time_slot')
        .eq('date', dateString)
        .neq('status', 'cancelled');

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      const bookedSlots = (bookings || []).map((b) => b.time_slot);

      // Generate all available slots from config
      let allSlots: TimeSlot[] = [];
      for (const config of configData) {
        const slots = generateSlotsFromConfig(config, bookedSlots);
        allSlots = [...allSlots, ...slots];
      }

      // Sort by time
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