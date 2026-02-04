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
        <p className="text-muted-foreground max-w-md mx-auto">
          {t.selectPreferredSlot}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Calendar */}
        <div className="glass-card rounded-2xl p-5 md:p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              disabled={isSameMonth(currentMonth, today)}
              className="rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h3 className="text-lg font-semibold text-foreground capitalize font-sans">
              {format(currentMonth, 'LLLL yyyy', { locale })}
            </h3>
            <Button variant="ghost" size="icon" onClick={goToNextMonth} className="rounded-xl">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {t.dayNames.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "text-center text-xs font-semibold py-2 uppercase tracking-wide",
                  index === 0 ? "text-destructive/70" : "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
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
                    "aspect-square rounded-xl text-sm font-medium transition-all duration-200",
                    isSelected && "bg-navy text-navy-foreground shadow-lg scale-105",
                    !isSelected && !isDisabled && "hover:bg-primary/10 hover:text-primary text-foreground",
                    isDisabled && "text-muted-foreground/30 cursor-not-allowed",
                    isSunday && "text-destructive/30"
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border/50 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-muted-foreground/20" />
              {t.unavailable}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-navy" />
              {t.selected}
            </span>
          </div>
        </div>

        {/* Time Slots */}
        <div className="glass-card rounded-2xl p-5 md:p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground font-sans">
                {selectedDate ? format(selectedDate, 'EEEE', { locale }) : t.selectDateFirst}
              </h3>
              {selectedDate && (
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, 'd. MMMM yyyy', { locale })}
                </p>
              )}
            </div>
          </div>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">
                {t.selectDateToViewSlots}
              </p>
            </div>
          ) : isLoadingSlots ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground mt-4">{t.loadingSlots}</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-destructive/50" />
              </div>
              <p className="text-muted-foreground">
                {t.noSlotsAvailable}
              </p>
            </div>
          ) : (
            <div className="space-y-5 max-h-[320px] overflow-y-auto pr-1">
              {morningSlots.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {t.morning}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {morningSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => onTimeSelect(slot.time)}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          selectedTime === slot.time
                            ? "bg-navy text-navy-foreground shadow-md"
                            : "bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary"
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {t.afternoon}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {afternoonSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => onTimeSelect(slot.time)}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          selectedTime === slot.time
                            ? "bg-navy text-navy-foreground shadow-md"
                            : "bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary"
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
