import { useState, useEffect } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isAfter, isBefore, startOfToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimeSlot } from '@/types/booking';
import { generateTimeSlots } from '@/data/timeSlots';
import { cn } from '@/lib/utils';

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const today = startOfToday();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate starting day offset
  const startingDayIndex = monthStart.getDay();

  useEffect(() => {
    if (selectedDate) {
      setIsLoadingSlots(true);
      // Simulate API call delay
      setTimeout(() => {
        setTimeSlots(generateTimeSlots(selectedDate));
        setIsLoadingSlots(false);
      }, 300);
    }
  }, [selectedDate]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => addDays(startOfMonth(prev), -1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addDays(endOfMonth(prev), 1));
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates, today, and Sundays
    return isBefore(date, today) || isSameDay(date, today) || date.getDay() === 0;
  };

  const availableSlots = timeSlots.filter((slot) => slot.available);
  const morningSlots = availableSlots.filter((slot) => parseInt(slot.time.split(':')[0]) < 12);
  const afternoonSlots = availableSlots.filter((slot) => parseInt(slot.time.split(':')[0]) >= 12);

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Choose Date & Time
        </h2>
        <p className="text-muted-foreground">
          Select your preferred appointment slot
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-elegant">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              disabled={isSameMonth(currentMonth, today)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h3 className="text-lg font-semibold text-foreground">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className={cn(
                  "text-center text-xs font-medium py-2",
                  day === 'Sun' ? "text-destructive/70" : "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: startingDayIndex }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Days */}
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
                    "aspect-square rounded-lg text-sm font-medium transition-all duration-200",
                    isSelected && "bg-primary text-primary-foreground shadow-glow",
                    !isSelected && !isDisabled && "hover:bg-muted text-foreground",
                    isDisabled && "text-muted-foreground/40 cursor-not-allowed",
                    isSunday && "text-destructive/40"
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted-foreground/40" />
              Unavailable
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary" />
              Selected
            </span>
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-elegant">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date first'}
            </h3>
          </div>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Please select a date to view available time slots
              </p>
            </div>
          ) : isLoadingSlots ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground mt-4">Loading available slots...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground">
                No available slots for this date. Please select another day.
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-h-80 overflow-y-auto pr-2">
              {morningSlots.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">Morning</p>
                  <div className="grid grid-cols-3 gap-2">
                    {morningSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => onTimeSelect(slot.time)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          selectedTime === slot.time
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "bg-muted text-foreground hover:bg-primary/10 hover:text-primary"
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
                  <p className="text-sm font-medium text-muted-foreground mb-3">Afternoon</p>
                  <div className="grid grid-cols-3 gap-2">
                    {afternoonSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => onTimeSelect(slot.time)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          selectedTime === slot.time
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "bg-muted text-foreground hover:bg-primary/10 hover:text-primary"
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
