import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfToday } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar, Sun, Sunset } from 'lucide-react';
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

  const allSlots = timeSlots;
  const availableSlots = allSlots.filter((slot) => slot.available);
  const morningSlots = allSlots.filter((slot) => parseInt(slot.time.split(':')[0]) < 12);
  const afternoonSlots = allSlots.filter((slot) => parseInt(slot.time.split(':')[0]) >= 12);

  const getSlotColorClass = (slot: { available: boolean; bookedCount: number; totalCapacity: number }) => {
    if (!slot.available) return 'opacity-40 cursor-not-allowed';
    const remaining = slot.totalCapacity - slot.bookedCount;
    if (remaining <= 1) return ''; // yellow indicator added separately
    return '';
  };

  const getCapacityBadgeClass = (slot: { available: boolean; bookedCount: number; totalCapacity: number }) => {
    if (!slot.available) return 'text-muted-foreground/40';
    const remaining = slot.totalCapacity - slot.bookedCount;
    if (remaining <= 1) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Calendar - Enhanced */}
        <div className="glass-premium rounded-2xl p-5 sm:p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              disabled={isSameMonth(currentMonth, today)}
              className="rounded-xl h-10 w-10 hover:bg-primary/10 active:scale-95 transition-all duration-300 group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </Button>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground capitalize font-sans">
              {format(currentMonth, 'LLLL yyyy', { locale })}
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToNextMonth} 
              className="rounded-xl h-10 w-10 hover:bg-primary/10 active:scale-95 transition-all duration-300 group"
            >
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>

          {/* Day Names - Enhanced */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {t.dayNames.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "text-center text-[10px] sm:text-xs font-bold py-2 uppercase tracking-wider rounded-lg",
                  index === 0 ? "text-destructive/70 bg-destructive/5" : "text-muted-foreground/70"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid - Enhanced */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: startingDayIndex }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {days.map((day) => {
              const isDisabled = isDateDisabled(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isSunday = day.getDay() === 0;
              const isToday = isSameDay(day, today);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !isDisabled && onDateSelect(day)}
                  disabled={isDisabled}
                  className={cn(
                    "aspect-square rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 relative",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                    isSelected && "bg-gradient-to-br from-navy to-navy/90 text-navy-foreground shadow-lg shadow-navy/30 scale-105 z-10",
                    !isSelected && !isDisabled && "hover:bg-primary/15 hover:text-primary hover:scale-110 text-foreground active:scale-95",
                    isDisabled && "text-muted-foreground/20 cursor-not-allowed",
                    isSunday && !isSelected && "text-destructive/30",
                    isToday && !isSelected && "ring-1 ring-primary/30"
                  )}
                >
                  {format(day, 'd')}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend - Enhanced */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-5 border-t border-border/30 text-[10px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted-foreground/10 border border-muted-foreground/20" />
              {t.unavailable}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-br from-navy to-navy/80 shadow-sm" />
              {t.selected}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border border-primary/30 relative">
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              </div>
              {language === 'sk' ? 'Dnes' : 'Today'}
            </span>
          </div>
        </div>

        {/* Time Slots - Enhanced */}
        <div className="glass-premium rounded-2xl p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border/30">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-400",
              selectedDate 
                ? "bg-gradient-to-br from-primary/20 to-accent/30 text-primary shadow-inner-glow" 
                : "bg-muted/60 text-muted-foreground"
            )}>
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground font-sans truncate">
                {selectedDate ? format(selectedDate, 'EEEE', { locale }) : t.selectDateFirst}
              </h3>
              {selectedDate && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {format(selectedDate, 'd. MMMM yyyy', { locale })}
                </p>
              )}
            </div>
          </div>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-52 sm:h-72 text-center px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center mb-5 animate-float-slow">
                <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground text-sm sm:text-base font-medium">
                {t.selectDateToViewSlots}
              </p>
              <p className="text-muted-foreground/60 text-xs mt-2">
                {language === 'sk' ? 'Vyberte deň v kalendári vľavo' : 'Select a day from the calendar on the left'}
              </p>
            </div>
          ) : isLoadingSlots ? (
            <div className="py-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t.loadingSlots}
                </p>
              </div>
              <TimeSlotSkeleton />
            </div>
          ) : allSlots.length === 0 || availableSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 sm:h-72 text-center px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-destructive/10 to-destructive/5 flex items-center justify-center mb-5">
                <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-destructive/40" />
              </div>
              <p className="text-muted-foreground text-sm sm:text-base font-medium">
                {t.noSlotsAvailable}
              </p>
              <p className="text-muted-foreground/60 text-xs mt-2">
                {language === 'sk' ? 'Skúste vybrať iný deň' : 'Try selecting another day'}
              </p>
            </div>
          ) : (
            <div className="space-y-5 max-h-[300px] sm:max-h-[350px] overflow-y-auto pr-2 -mr-2">
              {morningSlots.length > 0 && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t.morning}
                    </p>
                    <span className="text-[10px] text-muted-foreground/60 ml-auto">
                      {morningSlots.filter(s => s.available).length} {language === 'sk' ? 'voľných' : 'available'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 stagger-fade">
                    {morningSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && onTimeSelect(slot.time)}
                        disabled={!slot.available}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          !slot.available && "opacity-40 cursor-not-allowed bg-muted/30",
                          slot.available && selectedTime === slot.time
                            ? "bg-gradient-to-br from-navy to-navy/90 text-navy-foreground shadow-lg shadow-navy/25 scale-105"
                            : slot.available
                              ? "bg-gradient-to-br from-muted/60 to-muted/30 text-foreground hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:scale-105 active:scale-95"
                              : ""
                        )}
                      >
                        {selectedTime === slot.time && slot.available && (
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                        )}
                        <span className="relative z-10">{slot.time}</span>
                        {slot.totalCapacity > 1 && (
                          <span className={cn(
                            "block text-[10px] font-semibold relative z-10 mt-0.5",
                            selectedTime === slot.time && slot.available
                              ? "text-navy-foreground/70"
                              : getCapacityBadgeClass(slot)
                          )}>
                            {slot.available
                              ? `${slot.totalCapacity - slot.bookedCount}/${slot.totalCapacity}`
                              : language === 'sk' ? 'plné' : 'full'
                            }
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {afternoonSlots.length > 0 && (
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sunset className="w-4 h-4 text-orange-500" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t.afternoon}
                    </p>
                    <span className="text-[10px] text-muted-foreground/60 ml-auto">
                      {afternoonSlots.filter(s => s.available).length} {language === 'sk' ? 'voľných' : 'available'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 stagger-fade">
                    {afternoonSlots.map((slot, index) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && onTimeSelect(slot.time)}
                        disabled={!slot.available}
                        style={{ animationDelay: `${index * 0.03}s` }}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          !slot.available && "opacity-40 cursor-not-allowed bg-muted/30",
                          slot.available && selectedTime === slot.time
                            ? "bg-gradient-to-br from-navy to-navy/90 text-navy-foreground shadow-lg shadow-navy/25 scale-105"
                            : slot.available
                              ? "bg-gradient-to-br from-muted/60 to-muted/30 text-foreground hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:scale-105 active:scale-95"
                              : ""
                        )}
                      >
                        {selectedTime === slot.time && slot.available && (
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                        )}
                        <span className="relative z-10">{slot.time}</span>
                        {slot.totalCapacity > 1 && (
                          <span className={cn(
                            "block text-[10px] font-semibold relative z-10 mt-0.5",
                            selectedTime === slot.time && slot.available
                              ? "text-navy-foreground/70"
                              : getCapacityBadgeClass(slot)
                          )}>
                            {slot.available
                              ? `${slot.totalCapacity - slot.bookedCount}/${slot.totalCapacity}`
                              : language === 'sk' ? 'plné' : 'full'
                            }
                          </span>
                        )}
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