import React from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfToday } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { useBlockedDates } from '@/hooks/useBlockedDates';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';
import TimeSlotSkeleton from './TimeSlotSkeleton';
import { TimeSlot } from '@/types/booking';
import { getSlotUnavailableClass } from './slotStyles';

interface DateTimeSelectionProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  serviceDuration?: number;
  therapistId?: string;
}

function getSlotAvailableClass(
  slot: TimeSlot,
  isSlotSelected: boolean,
  isInSelectedRange: boolean,
  isHovered: boolean,
): string {
  if (!slot.available) return '';
  if (isSlotSelected) return 'bg-primary text-primary-foreground shadow-[0_0_12px_rgba(59,130,246,0.3)]';
  if (isInSelectedRange) return 'bg-primary/20 text-primary ring-1 ring-primary/30';
  if (isHovered) return 'bg-primary/15 text-primary -translate-y-0.5';
  return 'text-foreground bg-[var(--glass-white)] border border-[var(--glass-border-subtle)] hover:bg-[var(--glass-white-md)] hover:border-[var(--glass-border)] hover:-translate-y-0.5';
}

function TimeSlotsContent({
  selectedDate,
  isLoadingSlots,
  allSlots,
  morningSlots,
  afternoonSlots,
  noSlotsMessage,
  selectDateMessage,
  language,
  requiredSlots,
  serviceDuration,
  renderSlotGrid,
}: Readonly<{
  selectedDate: Date | null;
  isLoadingSlots: boolean;
  allSlots: TimeSlot[];
  morningSlots: TimeSlot[];
  afternoonSlots: TimeSlot[];
  noSlotsMessage: string;
  selectDateMessage: string;
  language: string;
  requiredSlots: number;
  serviceDuration: number;
  renderSlotGrid: (slots: TimeSlot[]) => React.ReactNode;
}>) {
  if (!selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 min-h-[160px]">
        <Clock className="w-6 h-6 text-muted-foreground/20 mb-2" />
        <p className="text-xs text-muted-foreground">{selectDateMessage}</p>
      </div>
    );
  }

  if (isLoadingSlots) return <TimeSlotSkeleton />;

  if (allSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 min-h-[160px]">
        <p className="text-xs text-muted-foreground">{noSlotsMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {morningSlots.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
            {language === 'sk' ? 'Dopoludnia' : 'Morning'}
          </p>
          {renderSlotGrid(morningSlots)}
        </div>
      )}
      {afternoonSlots.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
            {language === 'sk' ? 'Popoludní' : 'Afternoon'}
          </p>
          {renderSlotGrid(afternoonSlots)}
        </div>
      )}
      {requiredSlots > 1 && (
        <p className="text-[10px] text-muted-foreground text-center">
          {language === 'sk'
            ? `Služba zaberie ${requiredSlots} po sebe idúcich slotov (${serviceDuration} min)`
            : `Service occupies ${requiredSlots} consecutive slots (${serviceDuration} min)`}
        </p>
      )}
    </div>
  );
}

const DateTimeSelection = ({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  serviceDuration = 30,
  therapistId,
}: DateTimeSelectionProps) => {
  const { t, language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const { data: timeSlots = [], isLoading: isLoadingSlots } = useTimeSlots(selectedDate, serviceDuration, therapistId);
  const { data: blockedDays = [] } = useBlockedDates(currentMonth);

  const { data: activeConfigs = [] } = useQuery({
    queryKey: ['active-time-configs'],
    queryFn: async () => {
      const { data } = await supabase.from('time_slots_config').select('day_of_week').eq('is_active', true);
      return (data || []).map(d => d.day_of_week);
    }
  });

  const requiredSlots = Math.ceil(serviceDuration / 30);

  // Compute which slot times are highlighted on hover (consecutive slots the service would occupy)
  const highlightedSlots = useMemo(() => {
    if (!hoveredSlot || requiredSlots <= 1) return new Set<string>();
    const [h, m] = hoveredSlot.split(':').map(Number);
    const startMin = h * 60 + m;
    const set = new Set<string>();
    for (let i = 0; i < requiredSlots; i++) {
      const min = startMin + i * 30;
      set.add(`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
    }
    return set;
  }, [hoveredSlot, requiredSlots]);

  // Same for selected slot
  const selectedSlots = useMemo(() => {
    if (!selectedTime || requiredSlots <= 1) return new Set<string>();
    const [h, m] = selectedTime.split(':').map(Number);
    const startMin = h * 60 + m;
    const set = new Set<string>();
    for (let i = 1; i < requiredSlots; i++) {
      const min = startMin + i * 30;
      set.add(`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
    }
    return set;
  }, [selectedTime, requiredSlots]);

  const locale = language === 'sk' ? sk : enUS;
  const today = startOfToday();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Start week on Monday (shift Sunday to end)
  const getMonStart = (date: Date) => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  };
  const startingDayIndex = getMonStart(monthStart);

  const dayLabels = language === 'sk'
    ? ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne']
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => addDays(startOfMonth(prev), -1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addDays(endOfMonth(prev), 1));
  };

  // Minimum 36h lead time — earliest bookable moment
  const minBookableTime = new Date(Date.now() + 36 * 60 * 60 * 1000);

  const isDateDisabled = (date: Date) => {
    // Check if the day of week is active in time_slots_config
    if (activeConfigs.length > 0 && !activeConfigs.includes(date.getDay())) return true;
    
    // Check if specifically blocked via admin
    const dateStr = format(date, 'yyyy-MM-dd');
    if (blockedDays.some(bd => bd.date === dateStr)) return true;

    // Disable if the entire day is before the 36h cutoff
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    if (endOfDay < minBookableTime) return true;
    return false;
  };

  const allSlots = timeSlots;
  const morningSlots = allSlots.filter((slot) => Number.parseInt(slot.time.split(':')[0]) < 12);
  const afternoonSlots = allSlots.filter((slot) => Number.parseInt(slot.time.split(':')[0]) >= 12);

  const renderSlotGrid = (slots: typeof allSlots) => (
    <div className="grid grid-cols-4 gap-1">
      {slots.map((slot) => {
        const isSlotSelected = selectedTime === slot.time && slot.available;
        const isInSelectedRange = selectedSlots.has(slot.time);
        const isHovered = highlightedSlots.has(slot.time) && slot.available;
        return (
          <button
            key={slot.time}
            data-testid={`time-slot-${slot.time}`}
            onClick={() => slot.available && onTimeSelect(slot.time)}
            onMouseEnter={() => slot.available && setHoveredSlot(slot.time)}
            onMouseLeave={() => setHoveredSlot(null)}
            disabled={!slot.available}
            title={!slot.available && slot.bookedCount > 0 ? (language === 'sk' ? 'Obsadené' : 'Booked') : undefined}
            className={cn(
              "py-2 sm:py-1.5 rounded-lg text-xs font-medium font-data transition-all duration-300 ease-liquid backdrop-blur-sm",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              getSlotUnavailableClass(slot),
              getSlotAvailableClass(slot, isSlotSelected, isInSelectedRange, isHovered),
            )}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
      {/* Calendar */}
      <div>
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <h4 className="text-xs font-semibold text-foreground capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale })}
          </h4>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              disabled={isSameMonth(currentMonth, today)}
              className="h-9 w-9 rounded-lg"
              aria-label="Previous month"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="h-9 w-9 rounded-lg"
              aria-label="Next month"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-0">
          {dayLabels.map((day, index) => (
            <div
              key={day}
              className={cn(
                "text-center text-[10px] font-semibold py-1",
                index >= 5 ? "text-destructive/50" : "text-muted-foreground/60"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0">
          {Array.from({ length: startingDayIndex }, (_, i) => `empty-col-${monthStart.getTime()}-${i}`).map((key) => (
            <div key={key} className="h-9 sm:aspect-square sm:h-auto" />
          ))}

          {days.map((day) => {
            const isDisabled = isDateDisabled(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isSunday = day.getDay() === 0;
            const isSaturday = day.getDay() === 6;
            const isToday = isSameDay(day, today);

            return (
              <button
                key={day.toISOString()}
                data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                onClick={() => !isDisabled && onDateSelect(day)}
                disabled={isDisabled}
                className={cn(
                  "h-9 sm:aspect-square sm:h-auto rounded text-xs font-medium transition-all duration-150 relative flex items-center justify-center",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isSelected && "bg-primary text-primary-foreground font-bold",
                  !isSelected && !isDisabled && "hover:bg-accent text-foreground",
                  isDisabled && "text-muted-foreground/20 cursor-not-allowed",
                  (isSunday || isSaturday) && !isSelected && !isDisabled && "text-destructive/40",
                  isToday && !isSelected && "ring-1 ring-primary/40 font-bold"
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <TimeSlotsContent
          selectedDate={selectedDate}
          isLoadingSlots={isLoadingSlots}
          allSlots={allSlots}
          morningSlots={morningSlots}
          afternoonSlots={afternoonSlots}
          noSlotsMessage={t.noSlotsAvailable}
          selectDateMessage={t.selectDateToViewSlots}
          language={language}
          requiredSlots={requiredSlots}
          serviceDuration={serviceDuration}
          renderSlotGrid={renderSlotGrid}
        />
      </div>
    </div>
  );
};

export default DateTimeSelection;
