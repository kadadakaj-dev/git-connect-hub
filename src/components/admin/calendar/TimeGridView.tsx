import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarEvent, SLOT_HEIGHT, TIME_SLOTS, timeToMinutes } from './types';
import {
  formatDateForInput,
  isToday,
  getCurrentTimePosition,
  getDayEventsWithPositions,
  getEventColorByCategory,
  getEndTime,
  formatTime,
  WEEKDAYS_SK,
  WEEKDAYS_EN,
} from './utils';
import { Phone, Mail } from 'lucide-react';
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
      {/* Day headers */}
      <div className="flex flex-shrink-0 border-b border-[var(--glass-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.48)_0%,rgba(234,246,255,0.24)_100%)]">
        <div className="w-14 md:w-[72px] flex-shrink-0 border-r border-[var(--glass-border-subtle)]" />
        <div className={`flex flex-1 ${viewMode === 'week' ? 'min-w-[600px] md:min-w-0' : ''}`}>
          {activeDays.map((date, i) => {
            const today = isToday(date);
            return (
              <div
                key={i}
                className={`flex-1 py-3 text-center border-r border-[var(--glass-border-subtle)] transition-colors ${
                  today ? 'bg-[rgba(191,226,255,0.18)]' : ''
                }`}
              >
                <div className="uppercase tracking-wider text-[10px] md:text-xs font-medium text-muted-foreground mb-1">
                  {weekdays[getDayIndex(date)]}
                </div>
                <div className={`inline-flex items-center justify-center ${
                  today
                    ? 'w-8 h-8 rounded-full bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] text-white font-bold text-base shadow-[0_12px_24px_rgba(79,149,213,0.24)]'
                    : 'text-base font-semibold text-[hsl(var(--soft-navy))]'
                }`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto bg-[rgba(255,255,255,0.18)] flex relative">
        {/* Time labels */}
        <div className="w-14 md:w-[72px] flex-shrink-0 border-r border-[var(--glass-border-subtle)] bg-[rgba(255,255,255,0.52)] backdrop-blur-lg z-20 sticky left-0">
          {TIME_SLOTS.map((time, index) => (
            <div
              key={index}
              className="relative pr-2 md:pr-3 text-right"
              style={{ height: `${SLOT_HEIGHT}px` }}
            >
              {time.endsWith(':00') && (
                <span className="absolute top-0 right-2 md:right-3 -translate-y-1/2 rounded-full bg-white/84 px-1.5 text-[11px] md:text-xs font-semibold text-muted-foreground shadow-[0_8px_18px_rgba(126,195,255,0.1)] tabular-nums">
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
                className={`flex-1 border-r border-[var(--glass-border-subtle)] relative group transition-colors ${
                  isBlocked
                    ? 'month-blocked-pattern'
                    : isToday(date)
                    ? 'bg-[rgba(191,226,255,0.22)]'
                    : 'bg-[rgba(255,255,255,0.24)] hover:bg-white/42'
                }`}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={(e) => onDropOnGrid(e, date)}
              >
                {/* Blocked day label */}
                {isBlocked && (
                  <div className="absolute inset-x-0 top-0 z-20 truncate border-b border-[rgba(220,38,38,0.16)] bg-[rgba(255,247,247,0.9)] px-2 py-1.5 text-[10px] md:text-xs text-destructive font-semibold backdrop-blur-md">
                    🚫 {blockedInfo.reason || (language === 'sk' ? 'Zablokované' : 'Blocked')}
                  </div>
                )}

                {/* Slot lines */}
                {TIME_SLOTS.map((time, slotIndex) => (
                  <div
                    key={slotIndex}
                    onClick={() => onCreateEvent(date, time)}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    className={`w-full border-b cursor-pointer hover:bg-[rgba(126,195,255,0.08)] transition-colors ${
                      time.endsWith(':00')
                        ? 'border-[rgba(64,114,163,0.18)]'
                        : 'border-[rgba(64,114,163,0.08)] border-dashed'
                    }`}
                  />
                ))}

                {/* Events — enhanced pill with full details */}
                {dayEvents.map(event => {
                  const colorClasses = getEventColorByCategory(event.type, event.status);
                  const endTime = getEndTime(event.startTime, event.duration);
                  const isSmall = event.duration <= 30;
                  const isMedium = event.duration > 30 && event.duration <= 45;

                  return (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, event)}
                      className={`absolute rounded-xl p-1.5 md:p-2.5 shadow-[0_10px_22px_rgba(126,195,255,0.12)] cursor-grab active:cursor-grabbing hover:shadow-[0_16px_28px_rgba(126,195,255,0.16)] transition-all overflow-hidden flex flex-col z-10 ${colorClasses}`}
                      style={event.style}
                      onClick={(e) => { e.stopPropagation(); onEditEvent(event); }}
                    >
                      {/* Time range — always visible */}
                      <div className="font-bold truncate leading-tight text-xs md:text-sm">
                        {formatTime(event.startTime)} – {endTime}
                        {event.status === 'pending' && <span className="ml-1 opacity-60">⏳</span>}
                      </div>

                      {/* Service name */}
                      {!isSmall && event.serviceName && (
                        <div className="font-semibold truncate leading-tight mt-0.5 text-[10px] md:text-xs">
                          {event.serviceName}
                        </div>
                      )}

                      {/* Client name */}
                      {!isSmall && (
                        <div className="font-normal truncate leading-tight mt-0.5 opacity-80 text-[10px] md:text-xs">
                          {event.title}
                        </div>
                      )}

                      {/* Contact info — only on larger events or day view */}
                      {!isSmall && !isMedium && (
                        <div className="mt-auto flex flex-col gap-0.5 text-[9px] md:text-[10px] opacity-60 overflow-hidden">
                          {event.clientPhone && (
                            <span className="flex items-center gap-1 truncate">
                              <Phone className="h-2.5 w-2.5 flex-shrink-0" /> {event.clientPhone}
                            </span>
                          )}
                          {event.clientEmail && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-2.5 w-2.5 flex-shrink-0" /> {event.clientEmail}
                            </span>
                          )}
                          {event.employeeName && (
                            <span className="truncate">{event.employeeName}</span>
                          )}
                        </div>
                      )}

                      {/* Small event: compact line */}
                      {isSmall && (
                        <div className="font-normal truncate leading-tight opacity-80 text-[9px] md:text-[10px]">
                          {event.serviceName ? `${event.serviceName} · ` : ''}{event.title}
                        </div>
                      )}

                      {/* Resize handle */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20 hover:bg-[rgba(36,71,107,0.08)] transition-colors rounded-b-xl"
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
