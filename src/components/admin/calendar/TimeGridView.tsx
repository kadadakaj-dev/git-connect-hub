import React, { useEffect, useState, useRef } from 'react';
import { CalendarEvent, SLOT_HEIGHT, TIME_SLOTS } from './types';
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
import { Phone, Mail, AlertTriangle, GripVertical } from 'lucide-react';
import type { Language } from '@/i18n/translations';
import type { TouchDragState } from '@/hooks/useTouchDrag';

interface TimeGridViewProps {
  language: Language;
  activeDays: Date[];
  events: CalendarEvent[];
  selectedTherapist: string;
  viewMode: 'day' | 'week';
  blockedDates: { date: string; reason: string | null }[];
  zoom: number;
  onCreateEvent: (date: Date, time: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void;
  onDropOnGrid: (e: React.DragEvent, date: Date) => void;
  onResizeStart: (id: string, startY: number, originalDuration: number) => void;
  onDayClick?: (date: Date) => void;
  // Touch drag
  touchDragState?: TouchDragState;
  onTouchDragStart?: (e: React.TouchEvent, event: CalendarEvent) => void;
  onTouchDragMove?: (e: React.TouchEvent) => void;
  onTouchDragEnd?: (e: React.TouchEvent) => void;
  dayColumnsRef?: React.RefObject<HTMLDivElement | null>;
  onUnblockDay?: (date: string) => void;
}

const TimeGridView = ({
  language,
  activeDays,
  events,
  selectedTherapist,
  viewMode,
  blockedDates,
  zoom,
  onCreateEvent,
  onEditEvent,
  onDragStart,
  onDropOnGrid,
  onResizeStart,
  onDayClick,
  touchDragState,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  dayColumnsRef,
  onUnblockDay,
}: TimeGridViewProps) => {
  const [, setTick] = useState(0);
  const weekdays = language === 'sk' ? WEEKDAYS_SK : WEEKDAYS_EN;
  const slotHeight = SLOT_HEIGHT * zoom;
  const isWeek = viewMode === 'week';
  
  // Calculate dynamic min width based on columns to prevent "spaghetti" narrow slots
  const therapistCount = selectedTherapist === 'all' ? 3 : 1;
  const totalColumns = activeDays.length * therapistCount;
  const minColWidth = isWeek ? 130 : 280; // Weekly view can be bit narrower per col
  const gridMinWidth = totalColumns * minColWidth;
  
  const todayLinePosition = getCurrentTimePosition(zoom);
  const localColumnsRef = useRef<HTMLDivElement>(null);
  const columnsRef = dayColumnsRef || localColumnsRef;

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const getDayIndex = (date: Date) => date.getDay() === 0 ? 6 : date.getDay() - 1;

  const isDragging = touchDragState?.isDragging ?? false;
  const dragEventId = touchDragState?.event?.id;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="flex flex-shrink-0 border-b border-[var(--glass-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.48)_0%,rgba(234,246,255,0.24)_100%)]">
        <div className="w-10 sm:w-14 md:w-[72px] flex-shrink-0 border-r border-[var(--glass-border-subtle)]" />
        <div
          className="flex flex-1"
          style={{ minWidth: `${gridMinWidth}px` }}
        >
          {activeDays.map((date, i) => {
            const today = isToday(date);
            const dateStr = formatDateForInput(date);
            const isBlocked = blockedDates.some(b => b.date === dateStr);
            return (
              <div
                key={i}
                className={`flex-1 py-2 sm:py-3 text-center border-r border-[var(--glass-border-subtle)] transition-colors relative ${
                  today ? 'bg-[rgba(191,226,255,0.18)]' : ''
                }`}
              >
                <div className="uppercase tracking-wider text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1">
                  {weekdays[getDayIndex(date)]}
                </div>
                <div
                  className={`inline-flex items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-primary/30 hover:ring-offset-1 rounded-full ${
                    today
                      ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] text-white font-bold text-sm sm:text-base shadow-[0_12px_24px_rgba(79,149,213,0.24)]'
                      : 'w-7 h-7 sm:w-8 sm:h-8 text-sm sm:text-base font-semibold text-[hsl(var(--soft-navy))] hover:bg-primary/10'
                  }`}
                  onClick={() => onDayClick?.(date)}
                >
                  {date.getDate()}
                </div>
                {isBlocked && (
                  <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">
                    <AlertTriangle className="w-3 h-3 text-destructive" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid body */}
      <div className="flex-1 overflow-auto bg-[rgba(255,255,255,0.18)] flex relative">
        {/* Time labels */}
        <div className="w-10 sm:w-14 md:w-[72px] flex-shrink-0 border-r border-[var(--glass-border-subtle)] bg-[rgba(255,255,255,0.52)] backdrop-blur-lg z-20 sticky left-0">
          {TIME_SLOTS.map((time, index) => (
            <div
              key={index}
              className="relative pr-1 sm:pr-2 md:pr-3 text-right"
              style={{ height: `${slotHeight}px` }}
            >
              {time.endsWith(':00') && (
                <span className="absolute top-0 right-1 sm:right-2 md:right-3 -translate-y-1/2 rounded-full bg-white/84 px-1 sm:px-1.5 text-[9px] sm:text-[11px] md:text-xs font-semibold text-muted-foreground shadow-[0_8px_18px_rgba(126,195,255,0.1)] tabular-nums">
                  {time}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div
          ref={columnsRef}
          className="flex flex-1 relative"
          style={{ minWidth: `${gridMinWidth}px` }}
        >
          {activeDays.map((date, dayIndex) => {
            const dateStr = formatDateForInput(date);
            const dayEvents = getDayEventsWithPositions(events, dateStr, selectedTherapist, zoom);
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
                {isBlocked && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnblockDay?.(dateStr);
                    }}
                    className="absolute inset-x-0 top-0 z-20 truncate border-b border-[rgba(220,38,38,0.16)] bg-[rgba(255,247,247,0.95)] px-1 sm:px-2 py-1 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs text-destructive font-semibold backdrop-blur-md cursor-pointer hover:bg-[rgba(255,230,230,0.95)] transition-colors"
                    title={language === 'sk' ? 'Kliknite pre odblokovanie' : 'Click to unblock'}
                  >
                    🚫 {blockedInfo.reason || (language === 'sk' ? 'Zablokované' : 'Blocked')}
                  </div>
                )}

                {/* Time slot grid lines */}
                {TIME_SLOTS.map((time, slotIndex) => (
                  <div
                    key={slotIndex}
                    onClick={() => onCreateEvent(date, time)}
                    style={{ height: `${slotHeight}px` }}
                    className={`w-full border-b cursor-pointer hover:bg-[rgba(126,195,255,0.08)] transition-colors ${
                      time.endsWith(':00')
                        ? 'border-[rgba(64,114,163,0.18)]'
                        : 'border-[rgba(64,114,163,0.08)] border-dashed'
                    }`}
                  />
                ))}

                {/* Events */}
                {dayEvents.map(event => {
                  const colorClasses = getEventColorByCategory(event.type, event.status);
                  const endTime = getEndTime(event.startTime, event.duration);
                  const isSmall = event.duration <= 30;
                  const isMedium = event.duration > 30 && event.duration <= 45;
                  const isBeingDragged = isDragging && dragEventId === event.id;

                  return (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, event)}
                      // Touch drag — long press on the entire event card
                      onTouchStart={(e) => {
                        onTouchDragStart?.(e, event);
                      }}
                      onTouchMove={onTouchDragMove}
                      onTouchEnd={onTouchDragEnd}
                      className={`absolute rounded-lg sm:rounded-xl p-0.5 sm:p-1.5 md:p-2.5 shadow-[0_10px_22px_rgba(126,195,255,0.12)] cursor-grab active:cursor-grabbing hover:shadow-[0_16px_28px_rgba(126,195,255,0.16)] transition-all overflow-hidden flex flex-col z-10 ${colorClasses} ${
                        isBeingDragged ? 'opacity-30 scale-95' : ''
                      }`}
                      style={{
                        ...event.style,
                        minHeight: isWeek ? '28px' : '40px',
                      }}
                      onClick={(e) => {
                        if (isDragging) return;
                        e.stopPropagation();
                        onEditEvent(event);
                      }}
                    >
                      {/* Drag grip indicator — visible on touch devices */}
                      <div className="absolute top-0.5 right-0.5 sm:hidden opacity-40">
                        <GripVertical className="w-3 h-3" />
                      </div>

                      {/* Time range */}
                      <div className={`font-bold leading-tight whitespace-nowrap text-[#05060f] group-hover:text-black ${
                        isWeek ? 'text-[8px] sm:text-[10px] md:text-sm' : 'text-[10px] sm:text-[11px] md:text-sm'
                      }`}>
                        {formatTime(event.startTime)}{!isWeek || !isSmall ? ` – ${endTime}` : ''}
                        {event.status === 'pending' && <span className="ml-0.5 opacity-60">⏳</span>}
                      </div>

                      {/* Service name */}
                      {!isSmall && event.serviceName && (
                        <div className={`font-semibold truncate leading-tight mt-0.5 text-[#05060f] ${
                          isWeek ? 'text-[8px] sm:text-[9px] md:text-xs' : 'text-[9px] sm:text-[10px] md:text-xs'
                        }`}>
                          {event.serviceName}
                        </div>
                      )}

                      {/* Client name */}
                      {!isSmall && (
                        <div className={`font-normal truncate leading-tight mt-0.5 text-[#05060f]/90 ${
                          isWeek ? 'text-[8px] sm:text-[9px] md:text-xs hidden sm:block' : 'text-[9px] sm:text-[10px] md:text-xs'
                        }`}>
                          {event.title}
                        </div>
                      )}

                      {/* Contact details — only on large events in day view */}
                      {!isSmall && !isMedium && !isWeek && event.duration >= 60 && (
                        <div className="mt-auto flex flex-col gap-0.5 text-[9px] md:text-[10px] opacity-50 overflow-hidden">
                          {event.clientPhone && (
                            <span className="flex items-center gap-1 truncate">
                              <Phone className="h-2.5 w-2.5 flex-shrink-0" /> {event.clientPhone}
                            </span>
                          )}
                          {event.clientEmail && (
                            <span className="flex items-center gap-1 truncate hidden md:flex">
                              <Mail className="h-2.5 w-2.5 flex-shrink-0" /> {event.clientEmail}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Compact view for small events */}
                      {isSmall && (
                        <div className={`font-normal leading-tight opacity-80 whitespace-nowrap truncate ${
                          isWeek ? 'text-[7px] sm:text-[8px] md:text-[10px]' : 'text-[8px] sm:text-[9px] md:text-[10px]'
                        }`}>
                          {event.serviceName || event.title}
                        </div>
                      )}

                      {/* Resize handle — touch + mouse */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-3 sm:h-2 cursor-ns-resize z-20 hover:bg-[rgba(36,71,107,0.08)] transition-colors rounded-b-xl touch-manipulation"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onResizeStart(event.id, e.clientY, event.duration);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          const touch = e.touches[0];
                          onResizeStart(event.id, touch.clientY, event.duration);
                        }}
                      />
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isToday(date) && todayLinePosition !== null && (
                  <div
                    className="absolute left-0 w-full z-30 pointer-events-none"
                    style={{ top: `${todayLinePosition}px` }}
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

      {/* Touch drag ghost element */}
      {isDragging && touchDragState?.event && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${touchDragState.ghostX - 60}px`,
            top: `${touchDragState.ghostY - 20}px`,
          }}
        >
          <div className={`w-[120px] sm:w-[160px] rounded-xl p-2 shadow-[0_20px_40px_rgba(0,0,0,0.25)] border-2 border-primary/40 backdrop-blur-xl ${
            getEventColorByCategory(touchDragState.event.type, touchDragState.event.status)
          }`}>
            <div className="text-[10px] sm:text-xs font-bold truncate">
              {formatTime(touchDragState.event.startTime)} – {getEndTime(touchDragState.event.startTime, touchDragState.event.duration)}
            </div>
            {touchDragState.event.serviceName && (
              <div className="text-[9px] sm:text-[10px] font-semibold truncate mt-0.5">
                {touchDragState.event.serviceName}
              </div>
            )}
            <div className="text-[9px] sm:text-[10px] truncate opacity-80 mt-0.5">
              {touchDragState.event.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeGridView;
