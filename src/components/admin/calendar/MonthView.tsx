import { format } from 'date-fns';
import { CalendarEvent } from './types';
import {
  formatDateForInput,
  getMonthDays,
  isToday,
  getEventColorByCategory,
  getEndTime,
  formatTime,
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
      <div className="grid grid-cols-7 border-b border-[var(--glass-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.48)_0%,rgba(234,246,255,0.24)_100%)]">
        {weekdays.map(day => (
          <div key={day} className="border-r border-[var(--glass-border-subtle)] py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day.substring(0, 2)}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-y-auto bg-[rgba(255,255,255,0.18)]">
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
              className={`border-r border-b border-[var(--glass-border-subtle)] p-2 flex flex-col gap-1 min-h-[108px] cursor-pointer transition-colors
                ${!isCurrentMonth ? 'bg-white/12 opacity-55' : 'bg-white/30 hover:bg-white/58'}
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
                    ? 'flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] text-white shadow-[0_12px_24px_rgba(79,149,213,0.24)]'
                    : 'text-[hsl(var(--soft-navy))]'
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {isBlocked && (
                  <div className="truncate rounded-xl border border-[rgba(220,38,38,0.12)] bg-[rgba(255,247,247,0.92)] px-2 py-1 text-[10px] font-medium text-destructive shadow-[0_10px_18px_rgba(220,38,38,0.08)] md:text-xs">
                    🚫 {blockedInfo.reason || (language === 'sk' ? 'Zablokované' : 'Blocked')}
                  </div>
                )}
                {dayEvents.map(ev => (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); onDragStart(e, ev); }}
                    onClick={(e) => { e.stopPropagation(); onEditEvent(ev); }}
                    className={`text-[10px] md:text-xs truncate px-2 py-1 rounded-xl cursor-grab active:cursor-grabbing shadow-[0_10px_18px_rgba(126,195,255,0.08)] hover:shadow-[0_14px_22px_rgba(126,195,255,0.12)] transition-shadow ${getEventColorByCategory(ev.type, ev.status)}`}
                  >
                    <span className="font-bold mr-1">{formatTime(ev.startTime)}–{getEndTime(ev.startTime, ev.duration)}</span><span className="font-normal">{ev.serviceName || ev.title}</span>
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
