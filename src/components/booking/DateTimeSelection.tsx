import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfToday } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { useState } from 'react';
import TimeSlotSkeleton from './TimeSlotSkeleton';

interface DateTimeSelectionProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  serviceDuration?: number;
}

const DateTimeSelection = ({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
}: DateTimeSelectionProps) => {
  const { t, language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: timeSlots = [], isLoading: isLoadingSlots } = useTimeSlots(selectedDate);

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

  const isDateDisabled = (date: Date) => {
    return isBefore(date, today) || isSameDay(date, today) || date.getDay() === 0;
  };

  const allSlots = timeSlots;
  const availableSlots = allSlots.filter((slot) => slot.available);
  const morningSlots = allSlots.filter((slot) => parseInt(slot.time.split(':')[0]) < 12);
  const afternoonSlots = allSlots.filter((slot) => parseInt(slot.time.split(':')[0]) >= 12);

  const renderSlotGrid = (slots: typeof allSlots) => (
    <div className="grid grid-cols-4 gap-1">
      {slots.map((slot) => {
        const isSlotSelected = selectedTime === slot.time && slot.available;
        return (
          <button
            key={slot.time}
            onClick={() => slot.available && onTimeSelect(slot.time)}
            disabled={!slot.available}
            className={cn(
              "py-1.5 rounded text-xs font-medium font-data transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !slot.available && "opacity-25 cursor-not-allowed text-muted-foreground",
              isSlotSelected
                ? "bg-primary text-primary-foreground"
                : slot.available
                  ? "text-foreground hover:bg-primary/10 hover:text-primary"
                  : ""
            )}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Calendar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-foreground capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale })}
          </h4>
          <div className="flex gap-0.5">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              disabled={isSameMonth(currentMonth, today)}
              className="h-6 w-6 rounded"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-6 w-6 rounded">
              <ChevronRight className="w-3 h-3" />
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
          {Array.from({ length: startingDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
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
                onClick={() => !isDisabled && onDateSelect(day)}
                disabled={isDisabled}
                className={cn(
                  "aspect-square rounded text-xs font-medium transition-all duration-150 relative",
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
        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 min-h-[160px]">
            <Clock className="w-6 h-6 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground">{t.selectDateToViewSlots}</p>
          </div>
        ) : isLoadingSlots ? (
          <TimeSlotSkeleton />
        ) : allSlots.length === 0 || availableSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 min-h-[160px]">
            <p className="text-xs text-muted-foreground">{t.noSlotsAvailable}</p>
          </div>
        ) : (
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
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimeSelection;
