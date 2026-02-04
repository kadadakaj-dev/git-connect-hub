import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfToday } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { useState } from 'react';

interface DateTimeSelectionProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
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

  const startingDayIndex = monthStart.getDay();

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => addDays(startOfMonth(prev), -1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addDays(endOfMonth(prev), 1));
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, today) || isSameDay(date, today) || date.getDay() === 0;
  };

  const availableSlots = timeSlots.filter((slot) => slot.available);
  const morningSlots = availableSlots.filter((slot) => parseInt(slot.time.split(':')[0]) < 12);
  const afternoonSlots = availableSlots.filter((slot) => parseInt(slot.time.split(':')[0]) >= 12);

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
          {t.chooseDateAndTime}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
          {t.selectPreferredSlot}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Calendar */}
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              disabled={isSameMonth(currentMonth, today)}
              className="rounded-xl h-9 w-9 hover:bg-primary/10 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h3 className="text-base sm:text-lg font-semibold text-foreground capitalize font-sans">
              {format(currentMonth, 'LLLL yyyy', { locale })}
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToNextMonth} 
              className="rounded-xl h-9 w-9 hover:bg-primary/10 active:scale-95 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
            {t.dayNames.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "text-center text-[10px] sm:text-xs font-semibold py-2 uppercase tracking-wider",
                  index === 0 ? "text-destructive/60" : "text-muted-foreground/80"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {Array.from({ length: startingDayIndex }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {days.map((day) => {
              const isDisabled = isDateDisabled(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isSunday = day.getDay() === 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !isDisabled && onDateSelect(day)}
                  disabled={isDisabled}
                  className={cn(
                    "aspect-square rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected && "bg-navy text-navy-foreground shadow-md scale-105",
                    !isSelected && !isDisabled && "hover:bg-primary/10 hover:text-primary hover:scale-105 text-foreground active:scale-95",
                    isDisabled && "text-muted-foreground/25 cursor-not-allowed",
                    isSunday && !isSelected && "text-destructive/25"
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t border-border/40 text-[10px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-muted-foreground/15" />
              {t.unavailable}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-navy" />
              {t.selected}
            </span>
          </div>
        </div>

        {/* Time Slots */}
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/40">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/15 flex items-center justify-center transition-transform duration-200 hover:scale-105">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-foreground font-sans truncate">
                {selectedDate ? format(selectedDate, 'EEEE', { locale }) : t.selectDateFirst}
              </h3>
              {selectedDate && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {format(selectedDate, 'd. MMMM yyyy', { locale })}
                </p>
              )}
            </div>
          </div>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground text-sm">
                {t.selectDateToViewSlots}
              </p>
            </div>
          ) : isLoadingSlots ? (
            <div className="flex flex-col items-center justify-center h-48 sm:h-64">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 sm:border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
              <p className="text-muted-foreground mt-4 text-sm">{t.loadingSlots}</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-destructive/40" />
              </div>
              <p className="text-muted-foreground text-sm">
                {t.noSlotsAvailable}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[280px] sm:max-h-[320px] overflow-y-auto pr-1 -mr-1">
              {morningSlots.length > 0 && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    {t.morning}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {morningSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => onTimeSelect(slot.time)}
                        className={cn(
                          "px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          selectedTime === slot.time
                            ? "bg-navy text-navy-foreground shadow-md scale-105"
                            : "bg-muted/40 text-foreground hover:bg-primary/15 hover:text-primary hover:scale-105 active:scale-95"
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {afternoonSlots.length > 0 && (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    {t.afternoon}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {afternoonSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => onTimeSelect(slot.time)}
                        className={cn(
                          "px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          selectedTime === slot.time
                            ? "bg-navy text-navy-foreground shadow-md scale-105"
                            : "bg-muted/40 text-foreground hover:bg-primary/15 hover:text-primary hover:scale-105 active:scale-95"
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateTimeSelection;
