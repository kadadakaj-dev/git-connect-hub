export interface CalendarEvent {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  title: string;
  type: 'booking' | 'block';
  notes: string | null;
  therapistId: string | null;
  status: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceId?: string;
  serviceName?: string;
  employeeName?: string;
  createdAt?: string;
  bookingDuration?: number;
  serviceCategory?: string;
  servicePrice?: number;
  serviceDuration?: number;
}

export interface Employee {
  id: string;
  full_name: string;
  position: string;
  is_active: boolean;
}

export interface PositionedEvent extends CalendarEvent {
  style: {
    top: string;
    height: string;
    left: string;
    width: string;
  };
  startMins: number;
  endMins: number;
  colIdx: number;
}

export type ViewMode = 'day' | 'week' | 'month' | 'list';

export const SLOT_HEIGHT = 40;

export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let i = 6; i <= 21; i++) {
    slots.push(`${i < 10 ? '0' + i : i}:00`);
    slots.push(`${i < 10 ? '0' + i : i}:30`);
  }
  return slots;
};

export const TIME_SLOTS = generateTimeSlots();

export const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};
