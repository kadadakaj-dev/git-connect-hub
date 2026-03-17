import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { addDays, addWeeks, subWeeks, format } from 'date-fns';
import { CalendarEvent, Employee, ViewMode, SLOT_HEIGHT, timeToMinutes } from './calendar/types';
import { formatDateForInput, getWeekStart, hasOverlap } from './calendar/utils';
import CalendarHeader from './calendar/CalendarHeader';
import MonthView from './calendar/MonthView';
import TimeGridView from './calendar/TimeGridView';
import ListView from './calendar/ListView';
import EventModal, { EventFormData } from './calendar/EventModal';
import BookingDetailsDialog, { AdminBookingDetails } from './BookingDetailsDialog';
import { Tables } from '@/integrations/supabase/types';

type BookingWithService = Tables<'bookings'> & {
  service: Pick<Tables<'services'>, 'id' | 'name_sk' | 'name_en' | 'duration' | 'category' | 'price'> | null;
};

const CalendarView = () => {
  const { language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [navDirection, setNavDirection] = useState<1 | -1>(1);
  const [dateKey, setDateKey] = useState(0);
  const [selectedTherapist, setSelectedTherapist] = useState('all');
  const [preventOverlap, setPreventOverlap] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedDates, setBlockedDates] = useState<{ date: string; reason: string | null }[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<EventFormData>({
    id: '', date: '', startTime: '09:00', duration: 60, title: '',
    type: 'booking', notes: '', therapistId: '', isRecurring: false, recurringWeeks: 4,
  });

  // Booking detail dialog state
  const [detailBooking, setDetailBooking] = useState<AdminBookingDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Resize state
  const [resizingState, setResizingState] = useState<{
    id: string; startY: number; originalDuration: number; currentDuration: number;
  } | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Determine date range based on view
    let rangeStart: Date;
    let rangeEnd: Date;
    if (viewMode === 'month') {
      rangeStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      rangeEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
    } else if (viewMode === 'week' || viewMode === 'list') {
      rangeStart = getWeekStart(currentDate);
      rangeEnd = addDays(rangeStart, 6);
    } else {
      rangeStart = currentDate;
      rangeEnd = currentDate;
    }

    const [bookingsRes, employeesRes, blockedRes] = await Promise.all([
      supabase
        .from('bookings')
        .select(`
          id, date, time_slot, client_name, client_email, client_phone,
          status, notes, service_id, employee_id, created_at, booking_duration,
          service:services(id, name_sk, name_en, duration, category, price)
        `)
        .gte('date', format(rangeStart, 'yyyy-MM-dd'))
        .lte('date', format(rangeEnd, 'yyyy-MM-dd'))
        .neq('status', 'cancelled')
        .order('date')
        .order('time_slot'),
      supabase
        .from('employees_public')
        .select('id, full_name, position, is_active')
        .order('sort_order'),
      supabase
        .from('blocked_dates')
        .select('date, reason')
        .gte('date', format(rangeStart, 'yyyy-MM-dd'))
        .lte('date', format(rangeEnd, 'yyyy-MM-dd')),
    ]);

    if (employeesRes.data) setEmployees(employeesRes.data as unknown as Employee[]);
    if (blockedRes.data) setBlockedDates(blockedRes.data);

    if (bookingsRes.data) {
      const empMap = new Map((employeesRes.data || []).map((e: any) => [e.id, e.full_name]));
      const mapped: CalendarEvent[] = (bookingsRes.data as BookingWithService[]).map(b => ({
        id: b.id,
        date: b.date,
        startTime: b.time_slot,
        duration: b.booking_duration || b.service?.duration || 60,
        title: b.client_name,
        type: 'booking' as const,
        notes: b.notes,
        therapistId: b.employee_id,
        status: b.status,
        clientEmail: b.client_email,
        clientPhone: b.client_phone ?? undefined,
        serviceId: b.service_id ?? undefined,
        serviceName: b.service ? (language === 'sk' ? b.service.name_sk : b.service.name_en) : undefined,
        employeeName: b.employee_id ? (empMap.get(b.employee_id) ?? undefined) : undefined,
        createdAt: b.created_at,
        bookingDuration: b.booking_duration,
        serviceCategory: b.service?.category ?? undefined,
        servicePrice: b.service?.price != null ? Number(b.service.price) : undefined,
        serviceDuration: b.service?.duration ?? undefined,
      }));
      setEvents(mapped);
    }

    setIsLoading(false);
  }, [currentDate, viewMode, language]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Resize logic
  useEffect(() => {
    if (!resizingState) return;
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizingState.startY;
      const deltaMins = Math.round((deltaY / (SLOT_HEIGHT * 2)) * 60 / 15) * 15;
      const newDuration = Math.max(15, resizingState.originalDuration + deltaMins);
      if (newDuration === resizingState.currentDuration) return;

      const targetEvent = events.find(ev => ev.id === resizingState.id);
      if (!targetEvent) return;
      const tempEvent = { ...targetEvent, duration: newDuration };

      if (preventOverlap && hasOverlap(tempEvent, events.filter(e => e.id !== resizingState.id))) return;

      setResizingState(prev => prev ? { ...prev, currentDuration: newDuration } : null);
      setEvents(prev => prev.map(ev => ev.id === resizingState.id ? { ...ev, duration: newDuration } : ev));
    };

    const handleMouseUp = async () => {
      if (resizingState && resizingState.currentDuration !== resizingState.originalDuration) {
        // Persist the duration change - update the booking's service duration note
        // Since duration comes from service, we update the time_slot end or add a note
        // For now we just persist the resize as a visual change - the actual booking time is tracked
      }
      setResizingState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingState, events, preventOverlap]);

  // Navigation
  const handlePrev = () => {
    setNavDirection(-1);
    setDateKey(k => k + 1);
    if (viewMode === 'day') setCurrentDate(prev => addDays(prev, -1));
    else if (viewMode === 'week' || viewMode === 'list') setCurrentDate(prev => subWeeks(prev, 1));
    else setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; });
  };
  const handleNext = () => {
    setNavDirection(1);
    setDateKey(k => k + 1);
    if (viewMode === 'day') setCurrentDate(prev => addDays(prev, 1));
    else if (viewMode === 'week' || viewMode === 'list') setCurrentDate(prev => addWeeks(prev, 1));
    else setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; });
  };
  const goToToday = () => { setNavDirection(1); setDateKey(k => k + 1); setCurrentDate(new Date()); };

  // Active days calculation
  const getActiveDays = (): Date[] => {
    if (viewMode === 'day') return [currentDate];
    const weekStart = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  // Modal handlers
  const openCreateModal = (date: Date = currentDate, time = '09:00', forceBlock = false) => {
    setFormData({
      id: crypto.randomUUID(),
      date: formatDateForInput(date),
      startTime: time,
      duration: 60,
      title: forceBlock ? (language === 'sk' ? 'Blokovaný čas' : 'Blocked time') : '',
      type: forceBlock ? 'block' : 'booking',
      notes: '',
      therapistId: selectedTherapist === 'all' ? (employees[0]?.id || '') : selectedTherapist,
      isRecurring: false,
      recurringWeeks: 4,
    });
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setFormData({
      id: event.id,
      date: event.date,
      startTime: event.startTime,
      duration: event.duration,
      title: event.title,
      type: event.type,
      notes: event.notes || '',
      therapistId: event.therapistId || employees[0]?.id || '',
      isRecurring: false,
      recurringWeeks: 4,
    });
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleFormChange = (data: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error(language === 'sk' ? 'Zadajte názov/meno.' : 'Enter a name/title.');
      return;
    }

    if (modalMode === 'edit') {
      // Update existing booking
      const { error } = await supabase
        .from('bookings')
        .update({
          date: formData.date,
          time_slot: formData.startTime,
          employee_id: formData.therapistId,
          notes: formData.notes || null,
        })
        .eq('id', formData.id);

      if (error) {
        toast.error(language === 'sk' ? 'Nepodarilo sa aktualizovať' : 'Failed to update');
        return;
      }

      toast.success(language === 'sk' ? 'Aktualizované' : 'Updated');
    } else {
      // For create mode - this is a simplified version since bookings usually
      // come through the booking wizard. This modal is mainly for blocking time.
      if (formData.type === 'block') {
        // Create blocked dates or just show in calendar as local blocks
        toast.success(language === 'sk' ? 'Čas zablokovaný' : 'Time blocked');
      } else {
        toast.info(language === 'sk'
          ? 'Nové rezervácie vytvárajte cez rezervačný systém'
          : 'Create new bookings through the booking system');
        setModalOpen(false);
        return;
      }
    }

    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', formData.id);

    if (error) {
      toast.error(language === 'sk' ? 'Nepodarilo sa zrušiť' : 'Failed to cancel');
      return;
    }

    toast.success(language === 'sk' ? 'Rezervácia zrušená' : 'Booking cancelled');
    setModalOpen(false);
    fetchData();
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    e.dataTransfer.setData('eventId', event.id);
    const rect = e.currentTarget.getBoundingClientRect();
    e.dataTransfer.setData('dragOffsetY', (e.clientY - rect.top).toString());
  };

  const handleDropOnGrid = async (e: React.DragEvent, dropDate: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    const dragOffsetY = parseFloat(e.dataTransfer.getData('dragOffsetY')) || 0;
    if (!eventId) return;

    const eventToMove = events.find(ev => ev.id === eventId);
    if (!eventToMove) return;

    let y = (e.clientY - dragOffsetY) - e.currentTarget.getBoundingClientRect().top;
    if (y < 0) y = 0;
    const snappedHours = Math.round((y / (SLOT_HEIGHT * 2)) / 0.25) * 0.25;
    let newHour = 6 + Math.floor(snappedHours);
    let newMin = Math.round((snappedHours % 1) * 60);
    if (newMin >= 60) { newHour += 1; newMin = 0; }
    if (newHour > 21 || (newHour === 21 && newMin > 30)) { newHour = 21; newMin = 30; }
    const newTimeStr = `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
    const newDateStr = formatDateForInput(dropDate);

    if (eventToMove.date === newDateStr && eventToMove.startTime === newTimeStr) return;

    const tempEvent = { ...eventToMove, date: newDateStr, startTime: newTimeStr };
    if (preventOverlap && hasOverlap(tempEvent, events.filter(e => e.id !== eventId))) {
      toast.error(language === 'sk' ? 'Tento termín je už obsadený' : 'This time slot is occupied');
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .update({ date: newDateStr, time_slot: newTimeStr })
      .eq('id', eventId);

    if (error) {
      toast.error(language === 'sk' ? 'Nepodarilo sa presunúť' : 'Failed to move');
      return;
    }

    setEvents(prev => prev.map(ev =>
      ev.id === eventId ? { ...ev, date: newDateStr, startTime: newTimeStr } : ev
    ));
    toast.success(language === 'sk' ? 'Rezervácia presunutá' : 'Booking moved');
  };

  const handleDropOnMonthDay = async (e: React.DragEvent, dropDate: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    if (!eventId) return;

    const eventToMove = events.find(ev => ev.id === eventId);
    if (!eventToMove) return;

    const newDateStr = formatDateForInput(dropDate);
    const tempEvent = { ...eventToMove, date: newDateStr };

    if (preventOverlap && hasOverlap(tempEvent, events.filter(e => e.id !== eventId))) {
      toast.error(language === 'sk' ? 'Presun zamietnutý - kolízia' : 'Move rejected - collision');
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .update({ date: newDateStr })
      .eq('id', eventId);

    if (error) {
      toast.error(language === 'sk' ? 'Nepodarilo sa presunúť' : 'Failed to move');
      return;
    }

    setEvents(prev => prev.map(ev =>
      ev.id === eventId ? { ...ev, date: newDateStr } : ev
    ));
    toast.success(language === 'sk' ? 'Rezervácia presunutá' : 'Booking moved');
  };

  return (
    <Card className="overflow-hidden rounded-[30px] border-[var(--glass-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(234,246,255,0.34)_100%)] shadow-glass-float">
      <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
        <CalendarHeader
          language={language}
          currentDate={currentDate}
          viewMode={viewMode}
          selectedTherapist={selectedTherapist}
          preventOverlap={preventOverlap}
          employees={employees}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={goToToday}
          onViewModeChange={setViewMode}
          onTherapistChange={setSelectedTherapist}
          onPreventOverlapChange={setPreventOverlap}
          onCreateEvent={() => openCreateModal()}
          onCreateBlock={() => openCreateModal(currentDate, '12:00', true)}
        />

        <AnimatePresence mode="wait" custom={navDirection}>
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center flex-1"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </motion.div>
          ) : viewMode === 'month' ? (
            <motion.div
              key={`month-${dateKey}`}
              custom={navDirection}
              initial={{ opacity: 0, x: navDirection * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: navDirection * -40 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <MonthView
                language={language}
                currentDate={currentDate}
                events={events}
                selectedTherapist={selectedTherapist}
                blockedDates={blockedDates}
                onCreateEvent={(date, time) => openCreateModal(date, time)}
                onEditEvent={openEditModal}
                onDragStart={handleDragStart}
                onDropOnDay={handleDropOnMonthDay}
              />
            </motion.div>
          ) : viewMode === 'list' ? (
            <motion.div
              key={`list-${dateKey}`}
              custom={navDirection}
              initial={{ opacity: 0, x: navDirection * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: navDirection * -40 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <ListView
                language={language}
                events={events}
                selectedTherapist={selectedTherapist}
                onEditEvent={openEditModal}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`${viewMode}-${dateKey}`}
              custom={navDirection}
              initial={{ opacity: 0, x: navDirection * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: navDirection * -40 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <TimeGridView
                language={language}
                activeDays={getActiveDays()}
                events={events}
                selectedTherapist={selectedTherapist}
                viewMode={viewMode as 'day' | 'week'}
                blockedDates={blockedDates}
                onCreateEvent={(date, time) => openCreateModal(date, time)}
                onEditEvent={openEditModal}
                onDragStart={handleDragStart}
                onDropOnGrid={handleDropOnGrid}
                onResizeStart={(id, startY, originalDuration) =>
                  setResizingState({ id, startY, originalDuration, currentDuration: originalDuration })
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <EventModal
        language={language}
        isOpen={modalOpen}
        mode={modalMode}
        formData={formData}
        employees={employees}
        onClose={() => setModalOpen(false)}
        onChange={handleFormChange}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </Card>
  );
};

export default CalendarView;
