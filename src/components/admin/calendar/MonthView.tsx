import { format } from 'date-fns';
import { CalendarEvent } from './types';
import {
  formatDateForInput,
  getMonthDays,
  isToday,
  getEventColorClasses,
  FULL_WEEKDAYS_SK,
  FULL_WEEKDAYS_EN,
} from './utils';
import type { Language } from '@/i18n/translations';

interface MonthViewProps {
  language: Language;
  currentDate: Date;
  events: CalendarEvent[];
  selectedTherapist: string;
  blockedDates: { date: string; reason: string | null }[];
  onCreateEvent: (date: Date, time?: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void;
  onDropOnDay: (e: React.DragEvent, date: Date) => void;
}

const MonthView = ({
  language,
  currentDate,
  events,
  selectedTherapist,
  onCreateEvent,
  onEditEvent,
  onDragStart,
  onDropOnDay,
}: MonthViewProps) => {
  const weekdays = language === 'sk' ? FULL_WEEKDAYS_SK : FULL_WEEKDAYS_EN;
  const monthDays = getMonthDays(currentDate);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {weekdays.map(day => (
          <div key={day} className="py-2 text-center border-r border-border font-semibold text-muted-foreground text-xs md:text-sm truncate px-1">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day.substring(0, 2)}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-card overflow-y-auto">
        {monthDays.map((date, i) => {
          const dateStr = formatDateForInput(date);
          let dayEvents = events.filter(e => e.date === dateStr);
          if (selectedTherapist !== 'all') dayEvents = dayEvents.filter(e => e.therapistId === selectedTherapist);

          return (
            <div
              key={i}
              className={`border-r border-b border-border/50 p-1 md:p-2 flex flex-col gap-1 min-h-[80px] cursor-pointer
                ${date.getMonth() === currentDate.getMonth() ? 'bg-card' : 'bg-secondary/50 text-muted-foreground'}
                ${isToday(date) ? 'bg-accent/40' : ''}
              `}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => onDropOnDay(e, date)}
              onClick={() => onCreateEvent(date, '09:00')}
            >
              <span className={`text-xs font-semibold ${isToday(date)
                ? 'text-primary bg-card rounded-full w-5 h-5 flex items-center justify-center shadow-sm'
                : ''
              }`}>
                {date.getDate()}
              </span>
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {dayEvents.map(ev => (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); onDragStart(e, ev); }}
                    onClick={(e) => { e.stopPropagation(); onEditEvent(ev); }}
                    className={`text-[10px] md:text-xs truncate px-1.5 py-0.5 rounded cursor-grab active:cursor-grabbing border shadow-sm ${getEventColorClasses(ev.type, ev.status)}`}
                  >
                    <span className="font-bold mr-1">{ev.startTime}</span>{ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
