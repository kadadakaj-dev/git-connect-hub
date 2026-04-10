import { useState, useEffect, useCallback, useRef } from 'react';
import { generateId } from '@/lib/uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { addDays, addWeeks, subWeeks, format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { CalendarEvent, Employee, ViewMode, SLOT_HEIGHT, timeToMinutes } from './calendar/types';
import { formatDateForInput, getWeekStart, hasOverlap, getCurrentTimePosition } from './calendar/utils';
import CalendarHeader from './calendar/CalendarHeader';
import MonthView from './calendar/MonthView';
import TimeGridView from './calendar/TimeGridView';
import ListView from './calendar/ListView';
import EventModal, { EventFormData, ServiceOption } from './calendar/EventModal';
import BookingDetailsDialog, { AdminBookingDetails } from './BookingDetailsDialog';
import { Tables } from '@/integrations/supabase/types';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { useTouchDrag } from '@/hooks/useTouchDrag';

type BookingWithService = Tables<'bookings'> & {
  service: Pick<Tables<'services'>, 'id' | 'name_sk' | 'name_en' | 'duration' | 'category' | 'price'> | null;
};

function getBlockDates(dateStr: string, scope: 'day' | 'week' | 'month'): string[] {
  const date = new Date(dateStr);
  if (scope === 'day') return [dateStr];

  let start: Date, end: Date;
  if (scope === 'week') {
    const day = date.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day; // shift to Monday
    start = addDays(date, diff);
    end = addDays(start, 6);
  } else {
    start = startOfMonth(date);
    end = endOfMonth(date);
  }

  return eachDayOfInterval({ start, end })
    .filter(d => d.getDay() !== 0) // skip Sundays
    .map(d => format(d, 'yyyy-MM-dd'));
}

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
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [zoom, setZoom] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dayColumnsRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<EventFormData>({
    id: '', date: '', startTime: '09:00', duration: 60, title: '',
    type: 'booking', notes: '', therapistId: '', isRecurring: false, recurringWeeks: 4, blockScope: 'day',
    sendConfirmation: true,
  });

  // Booking detail dialog state
  const [detailBooking, setDetailBooking] = useState<AdminBookingDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Resize state
  const [resizingState, setResizingState] = useState<{
    id: string; startY: number; originalDuration: number; currentDuration: number;
  } | null>(null);

  // Touch drag & drop handler
  const handleTouchDrop = useCallback(async (eventId: string, dropDate: Date, newTimeStr: string) => {
    const eventToMove = events.find(ev => ev.id === eventId);
    if (!eventToMove) return;

    const newDateStr = formatDateForInput(dropDate);
    if (eventToMove.date === newDateStr && eventToMove.startTime === newTimeStr) return;

    const tempEvent = { ...eventToMove, date: newDateStr, startTime: newTimeStr };
    if (preventOverlap && hasOverlap(tempEvent, events.filter(e => e.id !== eventId))) {
      toast.error(language === 'sk' ? 'Tento termín je už plne obsadený' : 'This time slot is fully booked');
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
  }, [events, preventOverlap, language]);

  const activeDaysForDrag = getActiveDaysMemo();

  function getActiveDaysMemo(): Date[] {
    if (viewMode === 'day') return [currentDate];
    const weekStart = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
      .filter(d => d.getDay() !== 0 && d.getDay() !== 6);
  }

  const touchDrag = useTouchDrag({
    zoom,
    onDrop: handleTouchDrop,
    gridRef: dayColumnsRef,
    activeDays: activeDaysForDrag,
    gutterWidth: 56,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);

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

    const [bookingsRes, employeesRes, blockedRes, blockedSlotsRes, servicesRes] = await Promise.all([
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
      supabase
        .from('blocked_slots')
        .select('id, date, time_slot, duration, therapist_id, reason')
        .gte('date', format(rangeStart, 'yyyy-MM-dd'))
        .lte('date', format(rangeEnd, 'yyyy-MM-dd')),
      supabase
        .from('services')
        .select('id, name_sk, name_en, duration, price, category')
        .eq('is_active', true)
        .order('sort_order'),
    ]);

    if (employeesRes.data) setEmployees(employeesRes.data as Employee[]);
    if (blockedRes.data) setBlockedDates(blockedRes.data);
    if (servicesRes.data) setServices(servicesRes.data as ServiceOption[]);

    if (bookingsRes.data) {
      const empMap = new Map((employeesRes.data || []).map((e: { id: string; full_name: string }) => [e.id, e.full_name]));
      
      const bookingEvents: CalendarEvent[] = (bookingsRes.data as BookingWithService[]).map(b => ({
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
        employeeName: b.employee_id ? (empMap.get(b.employee_id) as string ?? undefined) : undefined,
        createdAt: b.created_at,
        bookingDuration: b.booking_duration,
        serviceCategory: b.service?.category ?? undefined,
        servicePrice: b.service?.price != null ? Number(b.service.price) : undefined,
        serviceDuration: b.service?.duration ?? undefined,
      }));

      const slotBlocks: CalendarEvent[] = (blockedSlotsRes.data || []).map((s) => ({
        id: s.id,
        date: s.date,
        startTime: s.time_slot,
        duration: s.duration,
        title: s.reason || (language === 'sk' ? 'Blokovaný čas' : 'Blocked time'),
        type: 'block' as const,
        therapistId: s.therapist_id || undefined,
        employeeName: s.therapist_id ? (empMap.get(s.therapist_id) as string ?? undefined) : undefined,
        notes: '',
        status: 'confirmed',
      }));

      setEvents([...bookingEvents, ...slotBlocks]);
    }

    setIsLoading(false);
  }, [currentDate, viewMode, language]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-scroll to current time when view loads
  useEffect(() => {
    if (isLoading || (viewMode !== 'day' && viewMode !== 'week')) return;
    const timer = setTimeout(() => {
      const pos = getCurrentTimePosition(zoom);
      if (pos !== null && scrollContainerRef.current) {
        const offset = Math.max(0, pos - 120);
        scrollContainerRef.current.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isLoading, viewMode, dateKey, zoom]);

  // Resize logic — mouse + touch
  useEffect(() => {
    if (!resizingState) return;

    const handleMove = (clientY: number) => {
      const deltaY = clientY - resizingState.startY;
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

    const handleEnd = async () => {
      if (resizingState && resizingState.currentDuration !== resizingState.originalDuration) {
        const { error } = await supabase
          .from('bookings')
          .update({ booking_duration: resizingState.currentDuration })
          .eq('id', resizingState.id);
        if (error) {
          setEvents(prev => prev.map(ev =>
            ev.id === resizingState.id ? { ...ev, duration: resizingState.originalDuration } : ev
          ));
          toast.error(language === 'sk' ? 'Nepodarilo sa zmeniť dĺžku' : 'Failed to resize booking');
        }
      }
      setResizingState(null);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const handleTouchMove = (e: TouchEvent) => { e.preventDefault(); handleMove(e.touches[0].clientY); };
    const handleMouseUp = () => handleEnd();
    const handleTouchEnd = () => handleEnd();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [resizingState, events, preventOverlap, language]);

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

  const getActiveDays = (): Date[] => {
    if (viewMode === 'day') return [currentDate];
    const weekStart = getWeekStart(currentDate);
    // Show only workdays (Mon-Fri) — Saturday is disabled, Sunday too
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
      .filter(d => d.getDay() !== 0 && d.getDay() !== 6);
  };

  const handleDayClick = (date: Date) => {
    setNavDirection(1);
    setDateKey(k => k + 1);
    setCurrentDate(date);
    setViewMode('day');
  };

  // Modal handlers
  const openCreateModal = (date: Date = currentDate, time = '09:00', forceBlock = false) => {
    const isSpecificSlot = forceBlock || time !== '09:00';
    setFormData({
      id: generateId(),
      date: formatDateForInput(date),
      startTime: time,
      duration: 60,
      title: forceBlock ? (language === 'sk' ? 'Blokovaný čas' : 'Blocked time') : '',
      type: forceBlock ? 'block' : 'booking',
      notes: '',
      therapistId: selectedTherapist === 'all' ? (employees[0]?.id || '') : selectedTherapist,
      isRecurring: false,
      recurringWeeks: 4,
      blockScope: isSpecificSlot ? 'time_slot' : 'day',
      sendConfirmation: true,
    });
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    if (event.type === 'booking') {
      const empName = event.employeeName || (event.therapistId
        ? employees.find(e => e.id === event.therapistId)?.full_name
        : undefined);
      setDetailBooking({
        id: event.id,
        client_name: event.title,
        client_email: event.clientEmail || '',
        client_phone: event.clientPhone || null,
        date: event.date,
        time_slot: event.startTime,
        status: event.status,
        notes: event.notes,
        created_at: event.createdAt || '',
        booking_duration: event.bookingDuration,
        services: event.serviceName ? {
          name_sk: event.serviceName,
          name_en: event.serviceName,
          category: event.serviceCategory,
          price: event.servicePrice,
          duration: event.serviceDuration,
        } : null,
        employees: empName ? { full_name: empName } : null,
        employee_id: event.therapistId,
      });
      setDetailOpen(true);
      return;
    }

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
    setFormData(prev => {
      const next = { ...prev, ...data };

      // Auto-fill title for blocks if current is empty or looks like a booking title
      if (data.type === 'block' && !next.title.trim()) {
        next.title = language === 'sk' ? 'Blokovaný čas' : 'Blocked time';
      }

      // If switching back to booking from an auto-filled block title, clear it
      if (data.type === 'booking' && (prev.title === 'Blokovaný čas' || prev.title === 'Blocked time')) {
        next.title = '';
      }

      return next;
    });
  };

  const handleSave = async () => {
    const isBlock = formData.type === 'block';

    // For blocks, if title is still empty, use default
    if (isBlock && !formData.title.trim()) {
      formData.title = language === 'sk' ? 'Blokovaný čas' : 'Blocked time';
    }

    if (!formData.title.trim()) {
      toast.error(language === 'sk' ? 'Zadajte názov/meno.' : 'Enter a name/title.');
      return;
    }

    try {
      if (modalMode === 'edit') {
        const { error } = await supabase
          .from('bookings')
          .update({
            date: formData.date,
            time_slot: formData.startTime,
            employee_id: formData.therapistId,
            notes: formData.notes || null,
          })
          .eq('id', formData.id);

        if (error) throw error;
        toast.success(language === 'sk' ? 'Aktualizované' : 'Updated');
      } else {
        if (isBlock) {
          if (formData.blockScope === 'time_slot') {
            const { error } = await supabase.from('blocked_slots').insert({
              date: formData.date,
              time_slot: formData.startTime,
              duration: formData.duration,
              therapist_id: formData.therapistId || null,
              reason: formData.title,
            });
            if (error) throw error;
            toast.success(language === 'sk' ? 'Čas bol zablokovaný' : 'Time slot blocked');
          } else {
            const dates = getBlockDates(formData.date, formData.blockScope || 'day');
            const rows = dates.map(d => ({ date: d, reason: formData.title || null }));
            const { error } = await supabase.from('blocked_dates').insert(rows);
            if (error) throw error;
            toast.success(
              dates.length === 1
                ? (language === 'sk' ? 'Deň zablokovaný' : 'Day blocked')
                : (language === 'sk' ? `Zablokovaných ${dates.length} dní` : `${dates.length} days blocked`)
            );
          }
        } else {
          if (!formData.clientEmail?.trim()) {
            toast.error(language === 'sk' ? 'Zadajte email klienta.' : 'Enter client email.');
            return;
          }

          const bookingsToInsert = [];
          const weeksCount = formData.isRecurring ? formData.recurringWeeks : 1;

          for (let w = 0; w < weeksCount; w++) {
            const bookingDate = w === 0
              ? formData.date
              : format(addDays(new Date(formData.date), w * 7), 'yyyy-MM-dd');

            let targetEmpId = formData.therapistId;
            const mainPersonId = 'ce777223-62f0-47ec-9b37-30a26d999610';
            const teamIds = [mainPersonId, '5c1c02af-cbbc-47a8-b7c7-1387aa53a7bc', '06acd843-2d63-4273-b352-14efae698b17'];

            if (targetEmpId === mainPersonId) {
              for (const slotId of teamIds) {
                const hasConflict = events.some(ev =>
                  ev.date === bookingDate &&
                  ev.therapistId === slotId &&
                  ev.status !== 'cancelled' &&
                  timeToMinutes(ev.startTime) < (timeToMinutes(formData.startTime) + formData.duration) &&
                  (timeToMinutes(ev.startTime) + ev.duration) > timeToMinutes(formData.startTime)
                );
                if (!hasConflict) {
                  targetEmpId = slotId;
                  break;
                }
              }
            }

            bookingsToInsert.push({
              date: bookingDate,
              time_slot: formData.startTime,
              client_name: formData.title,
              client_email: formData.clientEmail,
              client_phone: formData.clientPhone || null,
              employee_id: targetEmpId || null,
              service_id: formData.serviceId || null,
              notes: formData.notes || null,
              booking_duration: formData.duration,
              status: 'confirmed' as const,
            });
          }

          const { data: insertedRows, error } = await supabase.from('bookings').insert(bookingsToInsert).select('id, cancellation_token, client_email, client_name, date, time_slot, service_id');
          if (error) throw error;

          // Trigger confirmation emails if requested
          if (formData.sendConfirmation && insertedRows && insertedRows.length > 0) {
            const svc = services.find(s => s.id === formData.serviceId);
            const serviceName = svc ? (language === 'sk' ? svc.name_sk : svc.name_en) : 'Fyzioterapia';
            const serviceDuration = svc?.duration || 60;

            for (const row of insertedRows) {
              if (row.client_email && row.client_email !== 'block@system.local') {
                supabase.functions.invoke('send-booking-email', {
                  body: {
                    to: row.client_email,
                    clientName: row.client_name,
                    serviceName: `${serviceName} (${serviceDuration} min)`,
                    date: row.date,
                    time: row.time_slot,
                    cancellationToken: row.cancellation_token,
                    language: language === 'sk' ? 'sk' : 'en',
                  }
                }).catch(err => console.error('Failed to send admin-triggered confirmation:', err));
              }
            }
          }

          toast.success(
            weeksCount > 1
              ? (language === 'sk' ? `Vytvorených ${weeksCount} rezervácií` : `${weeksCount} bookings created`)
              : (language === 'sk' ? 'Rezervácia vytvorená' : 'Booking created')
          );
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Save error:', error);
      toast.error(
        language === 'sk'
          ? `Chyba pri ukladaní: ${error.message || 'Skontrolujte oprávnenia'}`
          : `Save failed: ${error.message || 'Check permissions'}`
      );
    }
  };


  const handleDelete = async () => {
    if (formData.type === 'block') {
      const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('id', formData.id);

      if (error) {
        toast.error(language === 'sk' ? 'Nepodarilo sa odstrániť blokáciu' : 'Failed to delete block');
        return;
      }
      toast.success(language === 'sk' ? 'Blokácia odstránená' : 'Block deleted');
    } else {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', formData.id);

      if (error) {
        toast.error(language === 'sk' ? 'Nepodarilo sa zrušiť' : 'Failed to cancel');
        return;
      }

      supabase
        .from('bookings')
        .select('cancellation_token, client_email, client_name, date, time_slot, services(name_sk, name_en)')
        .eq('id', formData.id)
        .single()
        .then(({ data: b }) => {
          if (!b || !b.client_email) return;
          const svc = b.services as { name_sk: string; name_en: string } | null;
          supabase.functions.invoke('send-booking-email', {
            body: {
              to: b.client_email,
              clientName: b.client_name,
              serviceName: (language === 'sk' ? svc?.name_sk : svc?.name_en) || svc?.name_sk || 'Služba',
              date: b.date,
              time: b.time_slot,
              cancellationToken: b.cancellation_token || '',
              language: language === 'sk' ? 'sk' : 'en',
              template: 'cancellation-client',
            }
          }).catch((err: unknown) => console.error('Failed to send cancellation email:', err));
        });

      toast.success(language === 'sk' ? 'Rezervácia zrušená' : 'Booking cancelled');
    }

    setModalOpen(false);
    fetchData();
  };

  const handleUnblock = async (date: string) => {
    if (!window.confirm(language === 'sk' ? 'Naozaj chcete odblokovať tento deň?' : 'Do you really want to unblock this day?')) return;
    const { error } = await supabase.from('blocked_dates').delete().eq('date', date);
    if (error) {
      toast.error(language === 'sk' ? 'Nepodarilo sa odblokovať deň' : 'Failed to unblock day');
      return;
    }
    toast.success(language === 'sk' ? 'Deň bol odblokovaný' : 'Day unblocked');
    fetchData();
  };

  // Drag & Drop handlers (desktop HTML5 + touch fallback via long-press tap)
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
      toast.error(language === 'sk' ? 'Tento termín je už plne obsadený' : 'This time slot is fully booked');
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

  // Zoom handlers
  const zoomIn = () => setZoom(prev => Math.min(1.8, +(prev + 0.1).toFixed(1)));
  const zoomOut = () => setZoom(prev => Math.max(0.8, +(prev - 0.1).toFixed(1)));
  const resetZoom = () => setZoom(1);

  // Touch swipe for navigation — only trigger on clearly horizontal swipes
  const touchRef = useRef({ startX: 0, startY: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.startY);
    // Only trigger on clearly horizontal swipes (dx > 80, dy must be < 40% of dx)
    if (Math.abs(dx) > 80 && dy < Math.abs(dx) * 0.4) {
      if (dx > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  // Pull to refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handlePullRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast.success(language === 'sk' ? 'Aktualizované' : 'Refreshed');
  };

  return (
    <Card className="overflow-hidden rounded-[30px] border-[var(--glass-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(234,246,255,0.34)_100%)] shadow-glass-float">
      <div
        className="flex flex-col h-[calc(100svh-160px)] sm:h-[calc(100svh-280px)] min-h-[400px] relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
          onRefresh={handlePullRefresh}
          isRefreshing={isRefreshing}
        />

        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-auto ${(viewMode === 'day' || viewMode === 'week') ? 'pb-16' : ''}`}
        >
          <div className="flex flex-col min-h-full">
            <AnimatePresence mode="wait" custom={navDirection}>
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center flex-1 min-h-[400px]"
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
                    onDayClick={handleDayClick}
                    onUnblockDay={handleUnblock}
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
                    zoom={zoom}
                    onCreateEvent={(date, time) => openCreateModal(date, time)}
                    onEditEvent={openEditModal}
                    onDragStart={handleDragStart}
                    onDropOnGrid={handleDropOnGrid}
                    onResizeStart={(id, startY, originalDuration) =>
                      setResizingState({ id, startY, originalDuration, currentDuration: originalDuration })
                    }
                    onDayClick={handleDayClick}
                    touchDragState={touchDrag.dragState}
                    onTouchDragStart={touchDrag.handleTouchStart}
                    onTouchDragMove={touchDrag.handleTouchMove}
                    onTouchDragEnd={touchDrag.handleTouchEnd}
                    dayColumnsRef={dayColumnsRef}
                    onUnblockDay={handleUnblock}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Zoom controls — mobile-optimized with bigger touch targets */}
        {(viewMode === 'day' || viewMode === 'week') && (
          <div className="absolute bottom-3 right-3 z-40 flex items-center gap-1 rounded-full bg-white/92 backdrop-blur-lg border border-[var(--glass-border-subtle)] shadow-glass-float px-1.5 py-1">
            <button
              onClick={zoomOut}
              disabled={zoom <= 0.8}
              className="p-2 rounded-full hover:bg-primary/10 disabled:opacity-30 transition-colors touch-manipulation"
              title={language === 'sk' ? 'Oddialiť' : 'Zoom out'}
            >
              <ZoomOut className="h-4 w-4 text-[hsl(var(--soft-navy))]" />
            </button>
            <button
              onClick={resetZoom}
              className="px-2 py-1 rounded-full hover:bg-primary/10 transition-colors text-[11px] font-semibold text-[hsl(var(--soft-navy))] tabular-nums min-w-[38px] text-center touch-manipulation"
              title={language === 'sk' ? 'Resetovať zoom' : 'Reset zoom'}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={zoom >= 1.8}
              className="p-2 rounded-full hover:bg-primary/10 disabled:opacity-30 transition-colors touch-manipulation"
              title={language === 'sk' ? 'Priblížiť' : 'Zoom in'}
            >
              <ZoomIn className="h-4 w-4 text-[hsl(var(--soft-navy))]" />
            </button>
          </div>
        )}
      </div>

      <EventModal
        language={language}
        isOpen={modalOpen}
        mode={modalMode}
        formData={formData}
        employees={employees}
        services={services}
        onClose={() => setModalOpen(false)}
        onChange={handleFormChange}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <BookingDetailsDialog
        booking={detailBooking}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSaved={fetchData}
        employees={employees.map(e => ({ id: e.id, full_name: e.full_name }))}
      />
    </Card>
  );
};

export default CalendarView;
