import { TimeSlot } from '@/types/booking';
import { format, addDays, isSameDay, isWeekend } from 'date-fns';

// Generate time slots for a given date
export const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const isWeekendDay = isWeekend(date);
  
  // Clinic hours: Mon-Fri 9am-6pm, Sat 9am-2pm, Sun closed
  if (date.getDay() === 0) {
    return []; // Sunday - closed
  }
  
  const startHour = 9;
  const endHour = isWeekendDay ? 14 : 18;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Simulate some slots being unavailable (for demo purposes)
      const isAvailable = Math.random() > 0.3;
      
      slots.push({
        time: timeString,
        available: isAvailable,
        bookedCount: 0,
        totalCapacity: 1,
      });
    }
  }
  
  return slots;
};

// Get available dates (next 30 days, excluding Sundays)
export const getAvailableDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 30; i++) {
    const date = addDays(today, i);
    if (date.getDay() !== 0) { // Exclude Sundays
      dates.push(date);
    }
  }
  
  return dates;
};
