import { format, startOfWeek, addDays as dateFnsAddDays } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import { CalendarEvent, PositionedEvent, SLOT_HEIGHT, timeToMinutes } from './types';
import type { Language } from '@/i18n/translations';

export const getLocale = (language: Language) => language === 'sk' ? sk : enUS;

export const formatDateForInput = (date: Date): string => format(date, 'yyyy-MM-dd');

export const getWeekStart = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

export const getCurrentTimePosition = (zoom = 1): number | null => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  if (hours < 6 || hours >= 22) return null;
  return ((hours - 6) + (minutes / 60)) * (SLOT_HEIGHT * 2 * zoom);
};

export const getMonthDays = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  const startDayOfWeek = firstDay.getDay();
  const padDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  for (let i = padDays; i > 0; i--) days.push(new Date(year, month, 1 - i));
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
  const endPad = 42 - days.length;
  for (let i = 1; i <= endPad; i++) days.push(new Date(year, month + 1, i));
  return days;
};

export const hasOverlap = (
  newEvent: { date: string; startTime: string; duration: number; therapistId: string | null },
  otherEvents: CalendarEvent[]
): boolean => {
  return otherEvents.some(ev => {
    if (ev.date !== newEvent.date) return false;
    if (ev.therapistId !== newEvent.therapistId) return false;
    const startA = timeToMinutes(newEvent.startTime);
    const endA = startA + Number(newEvent.duration);
    const startB = timeToMinutes(ev.startTime);
    const endB = startB + Number(ev.duration);
    return startA < endB && endA > startB;
  });
};

export const getDayEventsWithPositions = (
  events: CalendarEvent[],
  dateStr: string,
  selectedTherapist: string,
  zoom = 1
): PositionedEvent[] => {
  let dayEvents = events.filter(e => e.date === dateStr);
  if (selectedTherapist !== 'all') {
    const mainPersonId = 'ce777223-62f0-47ec-9b37-30a26d999610';
    if (selectedTherapist === mainPersonId) {
      // Include all team slots
      dayEvents = dayEvents.filter(e => e.employeeName?.startsWith('Personál FYZIOA&FIT') || e.therapistId === mainPersonId);
    } else {
      dayEvents = dayEvents.filter(e => e.therapistId === selectedTherapist);
    }
  }
  dayEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const clusters: { end: number; events: (CalendarEvent & { startMins: number; endMins: number; colIdx: number })[] }[] = [];
  dayEvents.forEach(event => {
    const start = timeToMinutes(event.startTime);
    const end = start + Number(event.duration);
    let added = false;
    for (const cluster of clusters) {
      if (cluster.end > start) {
        cluster.events.push({ ...event, startMins: start, endMins: end, colIdx: 0 });
        cluster.end = Math.max(cluster.end, end);
        added = true;
        break;
      }
    }
    if (!added) clusters.push({ end, events: [{ ...event, startMins: start, endMins: end, colIdx: 0 }] });
  });

  const hourHeight = SLOT_HEIGHT * 2 * zoom;
  const minEventHeight = Math.max(SLOT_HEIGHT * 1.5, SLOT_HEIGHT * 1.5 * zoom);
  const positionedEvents: PositionedEvent[] = [];

  clusters.forEach(cluster => {
    const columns: number[] = [];
    cluster.events.forEach(event => {
      let colIdx = 0;
      while (columns[colIdx] && columns[colIdx] > event.startMins) colIdx++;
      columns[colIdx] = event.endMins;
      event.colIdx = colIdx;
    });

    const maxCols = columns.length;
    cluster.events.forEach(event => {
      const top = ((event.startMins / 60) - 6) * hourHeight;
      const rawHeight = (Number(event.duration) / 60) * hourHeight;
      const height = Math.max(rawHeight, minEventHeight);
      const widthPercent = 100 / maxCols;
      const leftPercent = event.colIdx * widthPercent;

      positionedEvents.push({
        ...event,
        style: {
          top: `${top}px`,
          height: `${height}px`,
          left: `calc(${leftPercent}% + 2px)`,
          width: `calc(${widthPercent}% - 4px)`,
        },
      });
    });
  });

  return positionedEvents;
};

export const getEventColorClasses = (type: string, status?: string): string => {
  if (type === 'block') {
    return 'bg-white/76 border border-[rgba(87,107,129,0.12)] border-l-[rgba(87,107,129,0.55)] border-t-[rgba(87,107,129,0.12)] border-r-[rgba(87,107,129,0.12)] border-b-[rgba(87,107,129,0.12)] text-[hsl(var(--soft-navy))] backdrop-blur-md';
  }
  if (status === 'pending') {
    return 'bg-[rgba(255,248,235,0.88)] border border-[rgba(245,158,11,0.12)] border-l-[rgba(245,158,11,0.65)] border-t-[rgba(245,158,11,0.12)] border-r-[rgba(245,158,11,0.12)] border-b-[rgba(245,158,11,0.12)] text-[hsl(35,88%,32%)] backdrop-blur-md';
  }
  return 'bg-[rgba(234,246,255,0.88)] border border-[rgba(79,149,213,0.12)] border-l-[rgba(79,149,213,0.65)] border-t-[rgba(79,149,213,0.12)] border-r-[rgba(79,149,213,0.12)] border-b-[rgba(79,149,213,0.12)] text-[hsl(var(--soft-navy))] backdrop-blur-md';
};

export const minutesToTime = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Strip seconds from time strings like "09:30:00" → "09:30" */
export const formatTime = (time: string): string => {
  const parts = time.split(':');
  return `${parts[0]}:${parts[1]}`;
};

export const getEndTime = (startTime: string, duration: number): string => {
  const startMins = timeToMinutes(startTime);
  return minutesToTime(startMins + duration);
};

export const getEventColorByCategory = (type: string, status?: string, category?: string): string => {
  if (type === 'block') {
    return 'bg-white/76 border border-[rgba(87,107,129,0.12)] border-l-4 border-l-[rgba(87,107,129,0.55)] text-[hsl(var(--soft-navy))] backdrop-blur-md';
  }
  if (status === 'pending') {
    return 'bg-[rgba(255,248,235,0.92)] border border-[rgba(245,158,11,0.12)] border-l-4 border-l-[rgba(245,158,11,0.75)] text-[hsl(35,88%,32%)] backdrop-blur-md';
  }
  if (category === 'chiropractic') {
    return 'bg-[rgba(232,250,240,0.92)] border border-[rgba(34,197,94,0.12)] border-l-4 border-l-[rgba(34,197,94,0.65)] text-[hsl(152,60%,24%)] backdrop-blur-md';
  }
  // Default: physiotherapy / blue
  return 'bg-[rgba(234,246,255,0.92)] border border-[rgba(79,149,213,0.12)] border-l-4 border-l-[rgba(79,149,213,0.65)] text-[hsl(var(--soft-navy))] backdrop-blur-md';
};

export const WEEKDAYS_SK = ['po', 'ut', 'st', 'št', 'pi', 'so', 'ne'];
export const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const FULL_WEEKDAYS_SK = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa'];
export const FULL_WEEKDAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
