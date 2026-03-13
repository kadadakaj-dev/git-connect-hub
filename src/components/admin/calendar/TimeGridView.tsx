import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarEvent, SLOT_HEIGHT, TIME_SLOTS, timeToMinutes } from './types';
import {
  formatDateForInput,
  isToday,
  getCurrentTimePosition,
  getDayEventsWithPositions,
  getEventColorClasses,
  WEEKDAYS_SK,
  WEEKDAYS_EN,
} from './utils';
import type { Language } from '@/i18n/translations';

interface TimeGridViewProps {
  language: Language;
  activeDays: Date[];
  events: CalendarEvent[];
  selectedTherapist: string;
  viewMode: 'day' | 'week';
  blockedDates: { date: string; reason: string | null }[];
  onCreateEvent: (date: Date, time: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void;
  onDropOnGrid: (e: React.DragEvent, date: Date) => void;
  onResizeStart: (id: string, startY: number, originalDuration: number) => void;
}

const TimeGridView = ({
  language,
  activeDays,
  events,
  selectedTherapist,
  viewMode,
  blockedDates,
  onCreateEvent,
  onEditEvent,
  onDragStart,
  onDropOnGrid,
  onResizeStart,
}: TimeGridViewProps) => {
  const [, setTick] = useState(0);
  const weekdays = language === 'sk' ? WEEKDAYS_SK : WEEKDAYS_EN;

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const getDayIndex = (date: Date) => date.getDay() === 0 ? 6 : date.getDay() - 1;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers — pixel-perfect style */}
      <div className="flex border-b border-border/30 bg-card flex-shrink-0">
        <div className="w-14 md:w-[72px] flex-shrink-0 border-r border-border/30" />
        <div className={`flex flex-1 ${viewMode === 'week' ? 'min-w-[600px] md:min-w-0' : ''}`}>
          {activeDays.map((date, i) => {
            const today = isToday(date);
            return (
              <div
                key={i}
                className={`flex-1 py-3 text-center border-r border-border/30 transition-colors ${
                  today ? 'bg-primary/5' : ''
                }`}
              >
                <div className="uppercase tracking-wider text-[10px] md:text-xs font-medium text-muted-foreground mb-1">
                  {weekdays[getDayIndex(date)]}
                </div>
                <div className={`inline-flex items-center justify-center ${
                  today
                    ? 'w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-base'
                    : 'text-base font-semibold text-foreground'
                }`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto bg-card flex relative">
        {/* Time labels */}
        <div className="w-14 md:w-[72px] flex-shrink-0 border-r border-border/30 bg-card z-20 sticky left-0">
          {TIME_SLOTS.map((time, index) => (
            <div
              key={index}
              className="relative pr-2 md:pr-3 text-right"
              style={{ height: `${SLOT_HEIGHT}px` }}
            >
              {/* Only show full-hour labels */}
              {time.endsWith(':00') && (
                <span className="absolute top-0 right-2 md:right-3 -translate-y-1/2 bg-card px-1 text-[11px] md:text-xs font-semibold text-muted-foreground tabular-nums">
                  {time}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className={`flex flex-1 relative ${viewMode === 'week' ? 'min-w-[600px] md:min-w-0' : ''}`}>
          {activeDays.map((date, dayIndex) => {
            const dateStr = formatDateForInput(date);
            const dayEvents = getDayEventsWithPositions(events, dateStr, selectedTherapist);
            const blockedInfo = blockedDates.find(b => b.date === dateStr);
            const isBlocked = !!blockedInfo;

            return (
              <div
                key={dayIndex}
                className={`flex-1 border-r border-border/30 relative group transition-colors ${
                  isBlocked
                    ? 'month-blocked-pattern'
                    : isToday(date)
                    ? 'bg-primary/[0.03]'
                    : 'bg-card hover:bg-accent/10'
                }`}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={(e) => onDropOnGrid(e, date)}
              >
                {/* Blocked day label */}
                {isBlocked && (
                  <div className="absolute inset-x-0 top-0 z-20 bg-destructive/10 border-b border-destructive/20 px-2 py-1.5 text-[10px] md:text-xs text-destructive font-semibold truncate backdrop-blur-sm">
                    🚫 {blockedInfo.reason || (language === 'sk' ? 'Zablokované' : 'Blocked')}
                  </div>
                )}

                {/* Slot lines */}
                {TIME_SLOTS.map((time, slotIndex) => (
                  <div
                    key={slotIndex}
                    onClick={() => onCreateEvent(date, time)}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    className={`w-full border-b cursor-pointer hover:bg-primary/[0.06] transition-colors ${
                      time.endsWith(':00')
                        ? 'border-border/40'
                        : 'border-border/15 border-dashed'
                    }`}
                  />
                ))}

                {/* Events — pill style with left accent bar */}
                {dayEvents.map(event => {
                  const colorClasses = getEventColorClasses(event.type, event.status);
                  return (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, event)}
                      className={`absolute rounded-md border-l-[3px] p-1.5 md:p-2 text-[10px] md:text-xs shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all overflow-hidden flex flex-col z-10 ${colorClasses}`}
                      style={event.style}
                      onClick={(e) => { e.stopPropagation(); onEditEvent(event); }}
                    >
                      <div className="font-bold truncate leading-tight">
                        {event.startTime}
                        {event.status === 'pending' && <span className="ml-1 opacity-60">⏳</span>}
                      </div>
                      <div className="font-normal truncate leading-tight mt-0.5 opacity-80">
                        {event.title}
                      </div>
                      {event.duration > 30 && (
                        <div className="text-[9px] md:text-[10px] opacity-60 truncate mt-auto">
                          {event.duration} min{event.serviceName ? ` · ${event.serviceName}` : ''}
                        </div>
                      )}

                      {/* Resize handle */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20 hover:bg-foreground/10 transition-colors rounded-b-md"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onResizeStart(event.id, e.clientY, event.duration);
                        }}
                      />
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isToday(date) && getCurrentTimePosition() !== null && (
                  <div
                    className="absolute left-0 w-full z-30 pointer-events-none"
                    style={{ top: `${getCurrentTimePosition()}px` }}
                  >
                    <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] rounded-full bg-destructive ring-2 ring-destructive/30" />
                    <div className="w-full h-[2px] bg-destructive shadow-[0_0_4px_rgba(239,68,68,0.4)]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimeGridView;
