import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  GripVertical
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

interface Service {
  id: string;
  name_sk: string;
  name_en: string;
  duration: number;
  category: string;
}

interface Booking {
  id: string;
  date: string;
  time_slot: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  status: string;
  notes: string | null;
  service_id: string;
  service: Service | null;
}

// Service color palette - distinct colors for each service
const serviceColors: Record<string, { bg: string; text: string; border: string }> = {
  'Chiro masáž': { bg: 'bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500/40' },
  'Naprávanie': { bg: 'bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500/40' },
  'Celotelová chiro masáž': { bg: 'bg-teal-500/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-500/40' },
  'Express termín': { bg: 'bg-orange-500/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-500/40' },
};

// Fallback colors for services not in the predefined list
const fallbackColors = [
  { bg: 'bg-pink-500/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-500/40' },
  { bg: 'bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-500/40' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/40' },
  { bg: 'bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-500/40' },
];

const getServiceColor = (serviceName: string | undefined, serviceIndex: number = 0) => {
  if (!serviceName) {
    return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' };
  }
  
  // Check predefined colors first
  if (serviceColors[serviceName]) {
    return serviceColors[serviceName];
  }
  
  // Use fallback colors based on index
  return fallbackColors[serviceIndex % fallbackColors.length];
};

interface TimeSlotConfig {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// Draggable Booking Item Component
const DraggableBooking = ({ 
  booking, 
  language, 
  onClick 
}: { 
  booking: Booking; 
  language: 'sk' | 'en';
  onClick: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id,
    data: { booking },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const serviceName = booking.service?.name_sk;
  const colors = getServiceColor(serviceName);
  const isPending = booking.status === 'pending';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full text-left p-1.5 rounded text-xs mb-1 border transition-all cursor-grab active:cursor-grabbing ${colors.bg} ${colors.text} ${colors.border} ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''} ${isPending ? 'opacity-70 border-dashed' : ''}`}
    >
      <div className="flex items-start gap-1">
        <div 
          {...listeners} 
          {...attributes}
          className="flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3 h-3 opacity-50" />
        </div>
        <button onClick={onClick} className="flex-1 text-left min-w-0">
          <div className="font-medium truncate flex items-center gap-1">
            {booking.client_name}
            {isPending && <span className="text-[10px] opacity-60">⏳</span>}
          </div>
          <div className="truncate opacity-80">
            {booking.service 
              ? (language === 'sk' ? booking.service.name_sk : booking.service.name_en)
              : '-'
            }
          </div>
        </button>
      </div>
    </div>
  );
};

// Droppable Time Slot Component
const DroppableSlot = ({ 
  id, 
  isActive, 
  children 
}: { 
  id: string; 
  isActive: boolean; 
  children: React.ReactNode;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={`min-h-[60px] p-1 transition-colors ${
        isActive ? 'bg-background' : 'bg-muted/20'
      } ${isOver ? 'bg-primary/10 ring-2 ring-primary ring-inset' : ''}`}
    >
      {children}
    </div>
  );
};

// Drag Overlay Component
const DragOverlayContent = ({ 
  booking, 
  language
}: { 
  booking: Booking; 
  language: 'sk' | 'en';
}) => {
  const serviceName = booking.service?.name_sk;
  const colors = getServiceColor(serviceName);
  
  return (
    <div className={`w-32 p-2 rounded text-xs border shadow-xl ${colors.bg} ${colors.text} ${colors.border}`}>
      <div className="font-medium truncate">{booking.client_name}</div>
      <div className="truncate opacity-80">
        {booking.service 
          ? (language === 'sk' ? booking.service.name_sk : booking.service.name_en)
          : '-'
        }
      </div>
    </div>
  );
};

const CalendarView = () => {
  const { language } = useLanguage();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const locale = language === 'sk' ? sk : enUS;

  // Configure sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Generate time slots for display (8:00 - 18:00)
  const hours = Array.from({ length: 11 }, (_, i) => `${(8 + i).toString().padStart(2, '0')}:00`);

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const weekEnd = addDays(currentWeekStart, 6);
    
    const [bookingsRes, slotsRes, servicesRes] = await Promise.all([
      supabase
        .from('bookings')
        .select(`
          id,
          date,
          time_slot,
          client_name,
          client_email,
          client_phone,
          status,
          notes,
          service_id,
          service:services(id, name_sk, name_en, duration, category)
        `)
        .gte('date', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .neq('status', 'cancelled')
        .order('date')
        .order('time_slot'),
      supabase
        .from('time_slots_config')
        .select('*')
        .eq('is_active', true),
      supabase
        .from('services')
        .select('id, name_sk, name_en, duration, category')
        .eq('is_active', true)
        .order('sort_order')
    ]);

    if (bookingsRes.data) {
      setBookings(bookingsRes.data as Booking[]);
    }
    if (slotsRes.data) {
      setTimeSlots(slotsRes.data);
    }
    if (servicesRes.data) {
      setServices(servicesRes.data);
    }
    
    setIsLoading(false);
  };

  const getBookingsForDayAndTime = (day: Date, hour: string) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return bookings.filter(b => 
      b.date === dateStr && 
      b.time_slot.startsWith(hour.split(':')[0])
    );
  };

  const isDayActive = (day: Date) => {
    const dayOfWeek = day.getDay();
    return timeSlots.some(slot => slot.day_of_week === dayOfWeek);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => 
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const booking = event.active.data.current?.booking as Booking;
    setActiveBooking(booking);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveBooking(null);
    
    const { active, over } = event;
    
    if (!over) return;
    
    const booking = active.data.current?.booking as Booking;
    const [newDate, newTime] = (over.id as string).split('_');
    
    // Don't update if dropped in the same slot
    if (booking.date === newDate && booking.time_slot === newTime) {
      return;
    }

    // Check capacity - count bookings in target slot
    const slotBookings = bookings.filter(
      b => b.date === newDate && b.time_slot === newTime && b.id !== booking.id
    );

    // We need active employee count - fetch it
    const { data: activeEmps } = await supabase
      .from('employees')
      .select('id')
      .eq('is_active', true);

    const totalCapacity = Math.max(activeEmps?.length || 1, 1);

    if (slotBookings.length >= totalCapacity) {
      toast.error(
        language === 'sk' 
          ? 'Tento termín je už plne obsadený' 
          : 'This time slot is fully booked'
      );
      return;
    }

    // Update booking in database
    const { error } = await supabase
      .from('bookings')
      .update({ 
        date: newDate, 
        time_slot: newTime 
      })
      .eq('id', booking.id);

    if (error) {
      toast.error(
        language === 'sk' 
          ? 'Nepodarilo sa presunúť rezerváciu' 
          : 'Failed to move booking'
      );
      return;
    }

    // Update local state
    setBookings(prev => 
      prev.map(b => 
        b.id === booking.id 
          ? { ...b, date: newDate, time_slot: newTime }
          : b
      )
    );

    toast.success(
      language === 'sk' 
        ? 'Rezervácia bola presunutá' 
        : 'Booking has been moved'
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {language === 'sk' ? 'Kalendár rezervácií' : 'Booking Calendar'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              {language === 'sk' ? 'Dnes' : 'Today'}
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {format(currentWeekStart, 'd. MMMM', { locale })} - {format(addDays(currentWeekStart, 6), 'd. MMMM yyyy', { locale })}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {language === 'sk' 
            ? 'Potiahnite rezerváciu na iný čas pre zmenu termínu' 
            : 'Drag a booking to another time slot to reschedule'}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header with days */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="p-2 text-center text-sm font-medium text-muted-foreground">
                    <Clock className="w-4 h-4 mx-auto" />
                  </div>
                  {weekDays.map((day) => (
                    <div 
                      key={day.toISOString()} 
                      className={`p-2 text-center rounded-lg ${
                        isSameDay(day, new Date()) 
                          ? 'bg-primary text-primary-foreground' 
                          : isDayActive(day) 
                            ? 'bg-muted' 
                            : 'bg-muted/50 opacity-50'
                      }`}
                    >
                      <div className="text-xs uppercase">
                        {format(day, 'EEE', { locale })}
                      </div>
                      <div className="text-lg font-bold">
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time slots grid */}
                <div className="border rounded-lg overflow-hidden">
                  {hours.map((hour, hourIndex) => (
                    <div 
                      key={hour} 
                      className={`grid grid-cols-8 gap-px ${
                        hourIndex !== hours.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      <div className="p-2 text-xs text-muted-foreground bg-muted/30 flex items-center justify-center">
                        {hour}
                      </div>
                      {weekDays.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const slotId = `${dateStr}_${hour}`;
                        const dayBookings = getBookingsForDayAndTime(day, hour);
                        const isActive = isDayActive(day);
                        
                        return (
                          <DroppableSlot 
                            key={slotId} 
                            id={slotId} 
                            isActive={isActive}
                          >
                            {dayBookings.map((booking) => (
                              <DraggableBooking
                                key={booking.id}
                                booking={booking}
                                language={language}
                                onClick={() => setSelectedBooking(booking)}
                              />
                            ))}
                          </DroppableSlot>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend - Services */}
                <div className="flex items-center gap-4 mt-4 text-sm flex-wrap">
                  <span className="text-muted-foreground font-medium">
                    {language === 'sk' ? 'Služby:' : 'Services:'}
                  </span>
                  {services.map((service) => {
                    const colors = getServiceColor(service.name_sk);
                    return (
                      <div key={service.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${colors.bg} border ${colors.border}`}></div>
                        <span className="text-muted-foreground">
                          {language === 'sk' ? service.name_sk : service.name_en}
                        </span>
                      </div>
                    );
                  })}
                  <span className="text-muted-foreground mx-2">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] opacity-60">⏳</span>
                    <span className="text-muted-foreground">
                      {language === 'sk' ? 'Čakajúce' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {language === 'sk' ? 'Potiahnite pre presun' : 'Drag to move'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeBooking && (
                <DragOverlayContent
                  booking={activeBooking}
                  language={language}
                />
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Booking detail dialog */}
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'sk' ? 'Detail rezervácie' : 'Booking Details'}
              </DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {language === 'sk' ? 'Klient' : 'Client'}
                    </label>
                    <p className="font-medium">{selectedBooking.client_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {language === 'sk' ? 'Stav' : 'Status'}
                    </label>
                    <div>
                      <Badge className={getStatusColor(selectedBooking.status)}>
                        {selectedBooking.status === 'confirmed' 
                          ? (language === 'sk' ? 'Potvrdené' : 'Confirmed')
                          : selectedBooking.status === 'pending'
                            ? (language === 'sk' ? 'Čakajúce' : 'Pending')
                            : selectedBooking.status
                        }
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="font-medium">{selectedBooking.client_email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {language === 'sk' ? 'Telefón' : 'Phone'}
                    </label>
                    <p className="font-medium">{selectedBooking.client_phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {language === 'sk' ? 'Služba' : 'Service'}
                    </label>
                    <p className="font-medium">
                      {selectedBooking.service 
                        ? (language === 'sk' ? selectedBooking.service.name_sk : selectedBooking.service.name_en)
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {language === 'sk' ? 'Dátum a čas' : 'Date & Time'}
                    </label>
                    <p className="font-medium">
                      {format(new Date(selectedBooking.date), 'd. MMMM yyyy', { locale })}
                      {' '}o {selectedBooking.time_slot}
                    </p>
                  </div>
                </div>
                {selectedBooking.notes && (
                  <div>
                    <label className="text-sm text-muted-foreground">
                      {language === 'sk' ? 'Poznámky' : 'Notes'}
                    </label>
                    <p className="text-sm bg-muted p-2 rounded mt-1">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
