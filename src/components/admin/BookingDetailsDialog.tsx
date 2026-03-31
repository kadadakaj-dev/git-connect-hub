import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import {
  Calendar, Clock, Mail, MessageSquareText, Phone, User,
  UserRoundCheck, Timer, Tag, Banknote, Pencil, Save, X, Trash2,
  GripHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminBookingDetails {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  date: string;
  time_slot: string;
  status: string;
  notes: string | null;
  created_at: string;
  booking_duration?: number;
  services?: {
    name_sk: string;
    name_en: string;
    category?: string;
    price?: number;
    duration?: number;
  } | null;
  employees?: {
    full_name: string;
  } | null;
  employee_id?: string | null;
}

interface BookingDetailsDialogProps {
  booking: AdminBookingDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  employees?: { id: string; full_name: string }[];
}

interface EditForm {
  client_name: string;
  client_email: string;
  client_phone: string;
  date: string;
  time_slot: string;
  status: string;
  notes: string;
  employee_id: string;
  booking_duration: number;
}

const BookingDetailsDialog = ({ booking, open, onOpenChange, onSaved, employees }: BookingDetailsDialogProps) => {
  const { language } = useLanguage();
  const isSlovak = language === 'sk';
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({
    client_name: '', client_email: '', client_phone: '', date: '',
    time_slot: '', status: 'pending', notes: '', employee_id: '', booking_duration: 30,
  });

  // Swipe-to-dismiss state
  const [swipeY, setSwipeY] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeRef = useRef({ startY: 0, startTime: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (booking) {
      setForm({
        client_name: booking.client_name,
        client_email: booking.client_email,
        client_phone: booking.client_phone || '',
        date: booking.date,
        time_slot: booking.time_slot,
        status: booking.status,
        notes: booking.notes || '',
        employee_id: booking.employee_id || '',
        booking_duration: booking.booking_duration || booking.services?.duration || 30,
      });
      setIsEditing(false);
      setSwipeY(0);
    }
  }, [booking]);

  // Reset swipe when dialog opens
  useEffect(() => {
    if (open) setSwipeY(0);
  }, [open]);

  const handleSwipeStart = useCallback((clientY: number) => {
    // Only allow swipe from top of scrolled content
    const el = contentRef.current;
    if (el && el.scrollTop > 5) return;
    swipeRef.current = { startY: clientY, startTime: Date.now() };
    setIsSwiping(true);
  }, []);

  const handleSwipeMove = useCallback((clientY: number) => {
    if (!isSwiping) return;
    const dy = clientY - swipeRef.current.startY;
    if (dy > 0) {
      setSwipeY(dy);
    }
  }, [isSwiping]);

  const handleSwipeEnd = useCallback(() => {
    if (!isSwiping) return;
    setIsSwiping(false);
    const velocity = swipeY / (Date.now() - swipeRef.current.startTime) * 1000;
    if (swipeY > 120 || velocity > 500) {
      onOpenChange(false);
    }
    setSwipeY(0);
  }, [isSwiping, swipeY, onOpenChange]);

  const handleSave = async () => {
    if (!booking) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('bookings')
      .update({
        client_name: form.client_name,
        client_email: form.client_email,
        client_phone: form.client_phone || null,
        date: form.date,
        time_slot: form.time_slot,
        status: form.status,
        notes: form.notes || null,
        employee_id: form.employee_id || null,
        booking_duration: form.booking_duration,
      })
      .eq('id', booking.id);
    setIsSaving(false);

    if (error) {
      toast.error(isSlovak ? 'Nepodarilo sa uložiť zmeny' : 'Failed to save changes');
      return;
    }
    toast.success(isSlovak ? 'Rezervácia aktualizovaná' : 'Booking updated');
    setIsEditing(false);
    onSaved?.();
    onOpenChange(false);
  };

  const handleCancel = async () => {
    if (!booking) return;
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id);
    if (error) {
      toast.error(isSlovak ? 'Nepodarilo sa zrušiť' : 'Failed to cancel');
      return;
    }
    toast.success(isSlovak ? 'Rezervácia zrušená' : 'Booking cancelled');
    onSaved?.();
    onOpenChange(false);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      confirmed: { cls: 'bg-green-500/10 text-green-600 hover:bg-green-500/20', label: isSlovak ? 'Potvrdené' : 'Confirmed' },
      cancelled: { cls: 'bg-red-500/10 text-red-600 hover:bg-red-500/20', label: isSlovak ? 'Zrušené' : 'Cancelled' },
    };
    const def = { cls: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20', label: isSlovak ? 'Čakajúce' : 'Pending' };
    const s = map[status] || def;
    return <Badge className={s.cls}>{s.label}</Badge>;
  };

  const serviceName = booking?.services
    ? (isSlovak ? booking.services.name_sk : booking.services.name_en)
    : (isSlovak ? 'Bez služby' : 'No service');
  const employeeName = booking?.employees?.full_name || (isSlovak ? 'Nepriradený' : 'Unassigned');

  const inputCls = "rounded-[14px] border-[var(--glass-border-subtle)] bg-white/80 text-sm text-[hsl(var(--soft-navy))] focus:ring-2 focus:ring-primary/20 h-9 sm:h-10";

  const resetForm = () => {
    if (booking) {
      setForm({
        client_name: booking.client_name,
        client_email: booking.client_email,
        client_phone: booking.client_phone || '',
        date: booking.date,
        time_slot: booking.time_slot,
        status: booking.status,
        notes: booking.notes || '',
        employee_id: booking.employee_id || '',
        booking_duration: booking.booking_duration || booking.services?.duration || 30,
      });
    }
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setIsEditing(false); onOpenChange(o); }}>
      <DialogContent
        className="sm:max-w-lg rounded-t-[28px] sm:rounded-[28px] border-[var(--glass-border)] bg-[var(--glass-white-lg)] shadow-glass-float max-h-[92svh] flex flex-col overflow-hidden p-0"
        style={{
          transform: swipeY > 0 ? `translateY(${swipeY}px)` : undefined,
          opacity: swipeY > 0 ? Math.max(0.5, 1 - swipeY / 300) : undefined,
          transition: isSwiping ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        }}
      >
        {booking && (
          <>
            {/* Swipe handle — mobile */}
            <div
              className="flex-shrink-0 flex items-center justify-center pt-3 pb-1 sm:hidden cursor-grab active:cursor-grabbing touch-manipulation"
              onTouchStart={(e) => handleSwipeStart(e.touches[0].clientY)}
              onTouchMove={(e) => handleSwipeMove(e.touches[0].clientY)}
              onTouchEnd={handleSwipeEnd}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 px-4 sm:px-6 pt-2 sm:pt-6 pb-2 sm:pb-3">
              <DialogHeader>
                <div className="flex items-start justify-between gap-2 sm:gap-3 pr-8">
                  <div className="min-w-0">
                    <DialogTitle className="text-[hsl(var(--soft-navy))] text-base sm:text-lg">
                      {isEditing
                        ? (isSlovak ? 'Úprava rezervácie' : 'Edit booking')
                        : (isSlovak ? 'Detail rezervácie' : 'Booking details')}
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm truncate">{serviceName}</DialogDescription>
                  </div>
                  {!isEditing
                    ? getStatusBadge(booking.status)
                    : (
                      <select
                        value={form.status}
                        onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                        className={`text-xs rounded-full px-2 sm:px-3 py-1 border ${inputCls} h-auto`}
                      >
                        <option value="pending">{isSlovak ? 'Čakajúce' : 'Pending'}</option>
                        <option value="confirmed">{isSlovak ? 'Potvrdené' : 'Confirmed'}</option>
                        <option value="cancelled">{isSlovak ? 'Zrušené' : 'Cancelled'}</option>
                      </select>
                    )}
                </div>
              </DialogHeader>
            </div>

            {/* Scrollable content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4 text-sm"
              onTouchStart={(e) => {
                if (contentRef.current && contentRef.current.scrollTop <= 0) {
                  handleSwipeStart(e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => handleSwipeMove(e.touches[0].clientY)}
              onTouchEnd={handleSwipeEnd}
            >
              {/* Client + Appointment — stacked on mobile, side-by-side on desktop */}
              <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                {/* Client */}
                <div className="rounded-[16px] sm:rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-3 sm:p-4 shadow-[0_12px_24px_rgba(126,195,255,0.08)]">
                  <p className="mb-2 sm:mb-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {isSlovak ? 'Klient' : 'Client'}
                  </p>
                  <div className="space-y-2">
                    {isEditing ? (
                      <>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                          <Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} className={inputCls} placeholder={isSlovak ? 'Meno' : 'Name'} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                          <Input type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} className={inputCls} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                          <Input value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} className={inputCls} placeholder="+421..." />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-[hsl(var(--soft-navy))]">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="font-medium text-xs sm:text-sm">{booking.client_name}</span>
                        </div>
                        <div className="flex items-center gap-2 break-all text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                          <span className="text-xs sm:text-sm truncate">{booking.client_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                          <span className="text-xs sm:text-sm">{booking.client_phone || (isSlovak ? 'Nezadané' : 'Not provided')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Appointment */}
                <div className="rounded-[16px] sm:rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-3 sm:p-4 shadow-[0_12px_24px_rgba(126,195,255,0.08)]">
                  <p className="mb-2 sm:mb-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {isSlovak ? 'Termín' : 'Appointment'}
                  </p>
                  <div className="space-y-2">
                    {isEditing ? (
                      <>
                        {/* Date + Time in one row on mobile */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={`${inputCls} text-xs`} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <Input type="time" value={form.time_slot} onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))} className={`${inputCls} text-xs`} />
                          </div>
                        </div>
                        {/* Duration + Employee in one row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5">
                            <Timer className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <select
                              value={form.booking_duration}
                              onChange={e => setForm(f => ({ ...f, booking_duration: Number(e.target.value) }))}
                              className={`w-full p-1.5 sm:p-2 text-xs ${inputCls} h-auto`}
                            >
                              <option value="15">15m</option>
                              <option value="30">30m</option>
                              <option value="45">45m</option>
                              <option value="60">60m</option>
                              <option value="90">90m</option>
                              <option value="120">120m</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <UserRoundCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {employees && employees.length > 0 ? (
                              <select
                                value={form.employee_id}
                                onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                                className={`w-full p-1.5 sm:p-2 text-xs ${inputCls} h-auto`}
                              >
                                <option value="">{isSlovak ? 'Žiadny' : 'None'}</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                ))}
                              </select>
                            ) : (
                              <Input value={employeeName} disabled className={`${inputCls} text-xs`} />
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-[hsl(var(--soft-navy))]">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="font-medium text-xs sm:text-sm">
                            {format(new Date(booking.date), 'd. MMMM yyyy', { locale: isSlovak ? sk : undefined })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                          <span className="text-xs sm:text-sm">{booking.time_slot}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                          <span className="text-xs sm:text-sm">{booking.booking_duration || booking.services?.duration || '—'} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UserRoundCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                          <span className="text-xs sm:text-sm">{employeeName}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Service details */}
              {!isEditing && booking.services && (booking.services.category || booking.services.price != null) && (
                <div className="rounded-[16px] sm:rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-3 sm:p-4 shadow-[0_12px_24px_rgba(126,195,255,0.08)]">
                  <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {isSlovak ? 'Služba' : 'Service'}
                  </p>
                  <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                    {booking.services.category && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="capitalize">{booking.services.category}</span>
                      </div>
                    )}
                    {booking.services.price != null && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span>{booking.services.price} €</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="rounded-[16px] sm:rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-3 sm:p-4 shadow-[0_12px_24px_rgba(126,195,255,0.08)]">
                <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {isSlovak ? 'Poznámka' : 'Note'}
                </p>
                {isEditing ? (
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder={isSlovak ? 'Voliteľné poznámky...' : 'Optional notes...'}
                    className={`${inputCls} h-auto`}
                  />
                ) : (
                  <div className="flex items-start gap-2">
                    <MessageSquareText className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted-foreground" />
                    <p className="text-[hsl(var(--soft-navy))] text-xs sm:text-sm">
                      {booking.notes?.trim() || (isSlovak ? 'Bez poznámky' : 'No note provided')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer — sticky at bottom */}
            <div className="flex-shrink-0 border-t border-[var(--glass-border-subtle)] px-4 sm:px-6 py-2.5 sm:py-3 bg-[var(--glass-white-md)]">
              <div className="flex items-center justify-between gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      className="gap-1 sm:gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {isSlovak ? 'Zrušiť' : 'Cancel'}
                    </Button>
                    <div className="flex gap-1.5 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetForm}
                        className="gap-1 sm:gap-1.5 rounded-[14px] sm:rounded-[16px] border-[var(--glass-border-subtle)] bg-white/70 text-[hsl(var(--soft-navy))] text-xs sm:text-sm px-2.5 sm:px-3"
                      >
                        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {isSlovak ? 'Späť' : 'Back'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-1 sm:gap-1.5 rounded-[14px] sm:rounded-[16px] border border-white/20 bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] shadow-[0_16px_30px_rgba(79,149,213,0.22)] hover:brightness-[1.03] text-xs sm:text-sm px-2.5 sm:px-3"
                      >
                        <Save className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {isSaving ? '...' : (isSlovak ? 'Uložiť' : 'Save')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {isSlovak ? 'Vytvorené' : 'Created'}:{' '}
                      {booking.created_at && format(new Date(booking.created_at), 'd. MMM yyyy • HH:mm', { locale: isSlovak ? sk : undefined })}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-1 sm:gap-1.5 rounded-[14px] sm:rounded-[16px] border-[var(--glass-border-subtle)] bg-white/70 text-[hsl(var(--soft-navy))] hover:bg-white/82 text-xs sm:text-sm px-2.5 sm:px-3"
                    >
                      <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {isSlovak ? 'Upraviť' : 'Edit'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsDialog;
