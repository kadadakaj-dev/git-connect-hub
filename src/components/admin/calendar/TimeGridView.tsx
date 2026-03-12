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

  // Update current time line every minute
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatShortDate = (date: Date) => `${date.getDate()}.${date.getMonth() + 1}`;
  const getDayIndex = (date: Date) => date.getDay() === 0 ? 6 : date.getDay() - 1;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-border bg-secondary/30 flex-shrink-0">
        <div className="w-12 md:w-16 flex-shrink-0 border-r border-border" />
        <div className={`flex flex-1 ${viewMode === 'week' ? 'min-w-[600px] md:min-w-0' : ''}`}>
          {activeDays.map((date, i) => (
            <div
              key={i}
              className={`flex-1 py-2 text-center border-r border-border/50 font-semibold text-foreground ${
                isToday(date) ? 'bg-accent text-primary' : ''
              }`}
            >
              <span className="uppercase text-xs mr-1 opacity-70">
                {weekdays[getDayIndex(date)]}
              </span>
              {formatShortDate(date)}
            </div>
          ))}
        </div>
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto bg-card flex relative">
        {/* Time labels */}
        <div className="w-12 md:w-16 flex-shrink-0 border-r border-border bg-card z-20 sticky left-0">
          {TIME_SLOTS.map((time, index) => (
            <div
              key={index}
              className="relative pr-1 md:pr-2 text-right text-[10px] md:text-xs text-muted-foreground font-medium"
              style={{ height: `${SLOT_HEIGHT}px` }}
            >
              <span className="absolute top-0 right-1 md:right-2 -translate-y-1/2 bg-card px-1">
                {time}
              </span>
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
                className={`flex-1 border-r border-border/50 relative group ${
                  isBlocked ? 'bg-destructive/10' : isToday(date) ? 'bg-accent/30' : 'bg-card'
                }`}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={(e) => onDropOnGrid(e, date)}
              >
                {/* Blocked day overlay */}
                {isBlocked && (
                  <div className="absolute inset-x-0 top-0 z-20 bg-destructive/15 border-b border-destructive/30 px-2 py-1 text-[10px] md:text-xs text-destructive font-medium truncate">
                    🚫 {blockedInfo.reason || (language === 'sk' ? 'Zablokované' : 'Blocked')}
                  </div>
                )}
                {/* Slot lines */}
                {TIME_SLOTS.map((time, slotIndex) => (
                  <div
                    key={slotIndex}
                    onClick={() => onCreateEvent(date, time)}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    className={`w-full border-b cursor-pointer hover:bg-primary/10 transition-colors ${
                      time.includes(':30')
                        ? 'border-border/30 border-dashed'
                        : 'border-border/60 border-solid'
                    }`}
                  />
                ))}

                {/* Events */}
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, event)}
                    className={`absolute rounded-md p-1 md:p-1.5 text-[10px] md:text-xs border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all overflow-hidden flex flex-col z-10 ${getEventColorClasses(event.type, event.status)}`}
                    style={event.style}
                    onClick={(e) => { e.stopPropagation(); onEditEvent(event); }}
                  >
                    <div className="font-semibold truncate leading-tight flex-1">
                      {event.title}
                      {event.status === 'pending' && <span className="ml-1 opacity-60">⏳</span>}
                    </div>
                    <div className="opacity-80 truncate leading-tight mt-auto">
                      {event.startTime} ({event.duration}m)
                    </div>

                    {/* Resize handle */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20 hover:bg-foreground/10 transition-colors"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onResizeStart(event.id, e.clientY, event.duration);
                      }}
                    />
                  </div>
                ))}

                {/* Current time indicator */}
                {isToday(date) && getCurrentTimePosition() !== null && (
                  <div
                    className="absolute left-0 w-full z-30 pointer-events-none"
                    style={{ top: `${getCurrentTimePosition()}px` }}
                  >
                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-destructive" />
                    <div className="w-full h-[2px] bg-destructive" />
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
