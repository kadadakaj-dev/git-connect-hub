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

  const getCapacityColor = (slot: { available: boolean; bookedCount: number; totalCapacity: number }) => {
    if (!slot.available) return 'text-muted-foreground/40';
    const remaining = slot.totalCapacity - slot.bookedCount;
    if (remaining <= 1) return 'text-amber-500';
    return 'text-primary';
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {t.chooseDateAndTime}
        </h2>
        <p className="text-muted-foreground text-sm">{t.selectPreferredSlot}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Calendar */}
        <div className="bg-card border border-border/60 rounded-lg p-5 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              disabled={isSameMonth(currentMonth, today)}
              className="h-9 w-9 rounded-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-sm font-semibold text-foreground capitalize">
              {format(currentMonth, 'LLLL yyyy', { locale })}
            </h3>
            <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-9 w-9 rounded-md">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {t.dayNames.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "text-center text-[10px] font-semibold py-1.5 uppercase tracking-wider",
                  index === 0 ? "text-destructive/60" : "text-muted-foreground/60"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5">
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
                    "aspect-square rounded-md text-xs font-medium transition-all duration-200 relative",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    isSelected && "bg-primary text-primary-foreground shadow-soft",
                    !isSelected && !isDisabled && "hover:bg-accent text-foreground active:scale-95",
                    isDisabled && "text-muted-foreground/25 cursor-not-allowed",
                    isSunday && !isSelected && "text-destructive/30",
                    isToday && !isSelected && "ring-1 ring-primary/30 font-bold"
                  )}
                >
                  {format(day, 'd')}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-4 pt-4 border-t border-border/40 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/15" />
              {t.unavailable}
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              {t.selected}
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm border border-primary/30 relative">
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-primary" />
              </div>
              {language === 'sk' ? 'Dnes' : 'Today'}
            </span>
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-card border border-border/60 rounded-lg p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/40">
            <div className={cn(
              "w-10 h-10 rounded-md flex items-center justify-center",
              selectedDate ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {selectedDate ? format(selectedDate, 'EEEE', { locale }) : t.selectDateFirst}
              </h3>
              {selectedDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(selectedDate, 'd. MMMM yyyy', { locale })}
                </p>
              )}
            </div>
          </div>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Clock className="w-10 h-10 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm">{t.selectDateToViewSlots}</p>
              <p className="text-muted-foreground/50 text-xs mt-1">
                {language === 'sk' ? 'Vyberte deň v kalendári' : 'Select a day from the calendar'}
              </p>
            </div>
          ) : isLoadingSlots ? (
            <div className="py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <p className="text-xs text-muted-foreground">{t.loadingSlots}</p>
              </div>
              <TimeSlotSkeleton />
            </div>
          ) : allSlots.length === 0 || availableSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Clock className="w-10 h-10 text-destructive/30 mb-4" />
              <p className="text-muted-foreground text-sm">{t.noSlotsAvailable}</p>
              <p className="text-muted-foreground/50 text-xs mt-1">
                {language === 'sk' ? 'Skúste vybrať iný deň' : 'Try selecting another day'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 -mr-1">
              {morningSlots.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.morning}</p>
                    <span className="text-[10px] text-muted-foreground/50 ml-auto font-data">
                      {morningSlots.filter(s => s.available).length} {language === 'sk' ? 'voľných' : 'available'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {morningSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && onTimeSelect(slot.time)}
                        disabled={!slot.available}
                        className={cn(
                          "px-3 py-2 rounded-md text-sm font-medium font-data transition-all duration-200",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          !slot.available && "opacity-30 cursor-not-allowed bg-muted/30",
                          slot.available && selectedTime === slot.time
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : slot.available
                              ? "bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary active:scale-95"
                              : ""
                        )}
                      >
                        <span>{slot.time}</span>
                        {slot.totalCapacity > 1 && (
                          <span className={cn(
                            "block text-[10px] font-semibold mt-0.5",
                            selectedTime === slot.time && slot.available
                              ? "text-primary-foreground/70"
                              : getCapacityColor(slot)
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
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Sunset className="w-3.5 h-3.5 text-orange-500" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.afternoon}</p>
                    <span className="text-[10px] text-muted-foreground/50 ml-auto font-data">
                      {afternoonSlots.filter(s => s.available).length} {language === 'sk' ? 'voľných' : 'available'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {afternoonSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && onTimeSelect(slot.time)}
                        disabled={!slot.available}
                        className={cn(
                          "px-3 py-2 rounded-md text-sm font-medium font-data transition-all duration-200",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          !slot.available && "opacity-30 cursor-not-allowed bg-muted/30",
                          slot.available && selectedTime === slot.time
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : slot.available
                              ? "bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary active:scale-95"
                              : ""
                        )}
                      >
                        <span>{slot.time}</span>
                        {slot.totalCapacity > 1 && (
                          <span className={cn(
                            "block text-[10px] font-semibold mt-0.5",
                            selectedTime === slot.time && slot.available
                              ? "text-primary-foreground/70"
                              : getCapacityColor(slot)
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
