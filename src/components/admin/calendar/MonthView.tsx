import React from 'react';
import { CalendarEvent } from './types';
import {
  formatDateForInput,
  getMonthDays,
  isToday,
  getEventColorByCategory,
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
  onDayClick?: (date: Date) => void;
  onUnblockDay?: (date: string) => void;
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
  onDayClick,
  onUnblockDay,
}: MonthViewProps) => {
  // Only show Monday to Friday
  const weekdays = (language === 'sk' ? FULL_WEEKDAYS_SK : FULL_WEEKDAYS_EN).slice(0, 5);
  // Generate 55 consecutive workdays (Mon-Fri), starting from the first visible workday of the current month
  function getFirstWorkday(date: Date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1); // skip Sun/Sat
    return d;
  }
  function getNextWorkday(date: Date) {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d;
  }
  function getStaticWorkdays(startDate: Date, count: number) {
    const days = [];
    let d = new Date(startDate);
    for (let i = 0; i < count; i++) {
      days.push(new Date(d));
      d = getNextWorkday(d);
    }
    return days;
  }
  const firstWorkday = getFirstWorkday(currentDate);
  const workdays = getStaticWorkdays(firstWorkday, 55);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Weekday header: 5 columns (Mon-Fri) */}
      <div className="grid grid-cols-5 border-b border-[var(--glass-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.48)_0%,rgba(234,246,255,0.24)_100%)]">
        {weekdays.map((day, i) => (
          <div key={day} className="border-r border-[var(--glass-border-subtle)] py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.substring(0, 2)}</span>
          </div>
        ))}
      </div>

      {/* Static 55 workdays grid: 5 columns (Mon-Fri), 11 rows */}
      <div
        className="flex-1 grid grid-cols-5 auto-rows-fr overflow-y-auto bg-[rgba(255,255,255,0.18)]"
        style={{ margin: '0 auto' }}
      >
        {workdays.map((date, i) => {
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
              className={`border-r border-b border-[var(--glass-border-subtle)] p-0.5 sm:p-1.5 md:p-2 flex flex-col gap-0.5 min-h-[64px] sm:min-h-[90px] md:min-h-[108px] cursor-pointer transition-colors
                ${!isCurrentMonth ? 'bg-white/12 opacity-55' : 'bg-white/30 hover:bg-white/58'}
                ${isBlocked ? 'month-blocked-pattern' : ''}
              `}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => onDropOnDay(e, date)}
              onClick={() => onDayClick?.(date)}
            >
              {/* Day number — tap goes to day view */}
              <div className="flex justify-end">
                <span
                  className={`text-[10px] sm:text-xs md:text-base font-semibold leading-none cursor-pointer hover:ring-2 hover:ring-primary/30 hover:ring-offset-1 rounded-full transition-all
                    ${today
                      ? 'flex h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] text-white shadow-[0_12px_24px_rgba(79,149,213,0.24)]'
                      : 'flex h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 items-center justify-center text-[hsl(var(--soft-navy))] hover:bg-primary/10'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDayClick?.(date);
                  }}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto">
                {isBlocked && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnblockDay?.(dateStr);
                    }}
                    className="truncate rounded-lg sm:rounded-xl border border-[rgba(220,38,38,0.12)] bg-[rgba(255,247,247,0.92)] px-1 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-medium text-destructive shadow-[0_10px_18px_rgba(220,38,38,0.08)] md:text-xs hover:bg-[rgba(255,230,230,0.92)] cursor-pointer"
                    title={language === 'sk' ? 'Kliknite pre odblokovanie' : 'Click to unblock'}
                  >
                    🚫 {blockedInfo.reason || (language === 'sk' ? 'Zabl.' : 'Block')}
                  </div>
                )}
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); onDragStart(e, ev); }}
                    onClick={(e) => { e.stopPropagation(); onEditEvent(ev); }}
                    className={`text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 md:py-1.5 rounded-md sm:rounded-lg md:rounded-xl cursor-grab active:cursor-grabbing shadow-[0_10px_18px_rgba(126,195,255,0.08)] hover:shadow-[0_14px_22px_rgba(126,195,255,0.12)] transition-shadow leading-none flex items-center gap-1 ${getEventColorByCategory(ev.type, ev.status)}`}
                  >
                    <div className="font-bold truncate text-[#05060f]">{formatTime(ev.startTime)}</div>
                    <div className="font-medium truncate text-[#05060f]/90 hidden sm:block">{ev.serviceName || ev.title}</div>
                    {ev.title && ev.serviceName && (
                      <div className="font-normal truncate text-[#05060f]/70 hidden md:block">{ev.title}</div>
                    )}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="flex justify-center mt-0.5">
                    <div className="inline-flex items-center justify-center bg-[rgba(79,149,213,0.12)] border border-[rgba(79,149,213,0.24)] text-[rgba(36,71,107,0.85)] text-[8px] sm:text-[9px] font-bold h-4 w-4 sm:h-5 sm:w-5 rounded-full backdrop-blur-md shadow-sm">
                      +{dayEvents.length - 3}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
