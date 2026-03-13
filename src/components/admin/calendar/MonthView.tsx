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
  blockedDates,
  onCreateEvent,
  onEditEvent,
  onDragStart,
  onDropOnDay,
}: MonthViewProps) => {
  const weekdays = language === 'sk' ? FULL_WEEKDAYS_SK : FULL_WEEKDAYS_EN;
  const monthDays = getMonthDays(currentDate);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-border/30">
        {weekdays.map(day => (
          <div key={day} className="py-3 text-center border-r border-border/30 uppercase tracking-wider text-xs font-medium text-muted-foreground">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day.substring(0, 2)}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-card overflow-y-auto">
        {monthDays.map((date, i) => {
          const dateStr = formatDateForInput(date);
          let dayEvents = events.filter(e => e.date === dateStr);
          if (selectedTherapist !== 'all') dayEvents = dayEvents.filter(e => e.therapistId === selectedTherapist);
          const blockedInfo = blockedDates.find(b => b.date === dateStr);
          const isBlocked = !!blockedInfo;
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const today = isToday(date);

          return (
            <div
              key={i}
              className={`border-r border-b border-border/30 p-2 flex flex-col gap-1 min-h-[100px] cursor-pointer transition-colors hover:bg-accent/20
                ${!isCurrentMonth ? 'opacity-30' : 'bg-card'}
                ${isBlocked ? 'month-blocked-pattern' : ''}
              `}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => onDropOnDay(e, date)}
              onClick={() => onCreateEvent(date, '09:00')}
            >
              {/* Day number — top right */}
              <div className="flex justify-end">
                <span className={`text-base font-semibold leading-none
                  ${today
                    ? 'bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center'
                    : 'text-foreground'
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {isBlocked && (
                  <div className="text-[10px] md:text-xs px-2 py-1 rounded-md border-l-3 border-destructive bg-destructive/10 text-destructive font-medium truncate">
                    🚫 {blockedInfo.reason || (language === 'sk' ? 'Zablokované' : 'Blocked')}
                  </div>
                )}
                {dayEvents.map(ev => (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); onDragStart(e, ev); }}
                    onClick={(e) => { e.stopPropagation(); onEditEvent(ev); }}
                    className={`text-[10px] md:text-xs truncate px-2 py-1 rounded-md cursor-grab active:cursor-grabbing border-l-3 shadow-sm hover:shadow-md transition-shadow ${getEventColorClasses(ev.type, ev.status)}`}
                  >
                    <span className="font-bold mr-1">{ev.startTime}</span><span className="font-normal">{ev.title}</span>
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
