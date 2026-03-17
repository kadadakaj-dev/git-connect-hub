import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import {
  Calendar, Clock, Mail, MessageSquareText, Phone, User,
  UserRoundCheck, Timer, Tag, Banknote, Pencil, Save, X, Trash2,
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
    }
  }, [booking]);

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

  const inputCls = "rounded-[14px] border-[var(--glass-border-subtle)] bg-white/80 text-sm text-[hsl(var(--soft-navy))] focus:ring-2 focus:ring-primary/20";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setIsEditing(false); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg rounded-[28px] border-[var(--glass-border)] bg-[var(--glass-white-lg)] shadow-glass-float max-h-[90vh] overflow-y-auto">
        {booking && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <DialogTitle className="text-[hsl(var(--soft-navy))]">
                    {isEditing
                      ? (isSlovak ? 'Úprava rezervácie' : 'Edit booking')
                      : (isSlovak ? 'Detail rezervácie' : 'Booking details')}
                  </DialogTitle>
                  <DialogDescription className="mt-1">{serviceName}</DialogDescription>
                </div>
                {!isEditing
                  ? getStatusBadge(booking.status)
                  : (
                    <select
                      value={form.status}
                      onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                      className={`text-xs rounded-full px-3 py-1 border ${inputCls}`}
                    >
                      <option value="pending">{isSlovak ? 'Čakajúce' : 'Pending'}</option>
                      <option value="confirmed">{isSlovak ? 'Potvrdené' : 'Confirmed'}</option>
                      <option value="cancelled">{isSlovak ? 'Zrušené' : 'Cancelled'}</option>
                    </select>
                  )}
              </div>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Client */}
                <div className="rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-4 shadow-[0_12px_24px_rgba(126,195,255,0.08)]">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {isSlovak ? 'Klient' : 'Client'}
                  </p>
                  <div className="space-y-2.5">
                    {isEditing ? (
                      <>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} className={inputCls} placeholder={isSlovak ? 'Meno' : 'Name'} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Input type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} className={inputCls} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Input value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} className={inputCls} placeholder="+421..." />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-[hsl(var(--soft-navy))]">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{booking.client_name}</span>
                        </div>
                        <div className="flex items-center gap-2 break-all text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span>{booking.client_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{booking.client_phone || (isSlovak ? 'Nezadané' : 'Not provided')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Appointment */}
                <div className="rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-4 shadow-[0_12px_24px_rgba(126,195,255,0.08)]">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {isSlovak ? 'Termín' : 'Appointment'}
                  </p>
                  <div className="space-y-2.5">
                    {isEditing ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Input type="time" value={form.time_slot} onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))} className={inputCls} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-muted-foreground shrink-0" />
                          <select
                            value={form.booking_duration}
                            onChange={e => setForm(f => ({ ...f, booking_duration: Number(e.target.value) }))}
                            className={`w-full p-2 ${inputCls}`}
                          >
                            <option value="15">15 min</option>
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">60 min</option>
                            <option value="90">90 min</option>
                            <option value="120">120 min</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserRoundCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                          {employees && employees.length > 0 ? (
                            <select
                              value={form.employee_id}
                              onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                              className={`w-full p-2 ${inputCls}`}
                            >
                              <option value="">{isSlovak ? 'Nepriradený' : 'Unassigned'}</option>
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                              ))}
                            </select>
                          ) : (
                            <Input value={employeeName} disabled className={inputCls} />
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-[hsl(var(--soft-navy))]">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(booking.date), 'd. MMMM yyyy', { locale: isSlovak ? sk : undefined })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>{booking.time_slot}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Timer className="h-4 w-4 shrink-0" />
                          <span>{booking.booking_duration || booking.services?.duration || '—'} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UserRoundCheck className="h-4 w-4 shrink-0" />
                          <span>{employeeName}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Service details — read-only always */}
              {!isEditing && booking.services && (booking.services.category || booking.services.price != null) && (
                <div className="rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-4 shadow-[0_12px_24px_rgba(126,195,255,0.08)]">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {isSlovak ? 'Služba' : 'Service'}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {booking.services.category && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="h-4 w-4 shrink-0" />
                        <span className="capitalize">{booking.services.category}</span>
                      </div>
                    )}
                    {booking.services.price != null && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Banknote className="h-4 w-4 shrink-0" />
                        <span>{booking.services.price} €</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-4 shadow-[0_12px_24px_rgba(126,195,255,0.08)]">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {isSlovak ? 'Poznámka klienta' : 'Client note'}
                </p>
                {isEditing ? (
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder={isSlovak ? 'Voliteľné poznámky...' : 'Optional notes...'}
                    className={inputCls}
                  />
                ) : (
                  <div className="flex items-start gap-2">
                    <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-[hsl(var(--soft-navy))]">
                      {booking.notes?.trim() || (isSlovak ? 'Bez poznámky' : 'No note provided')}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isSlovak ? 'Zrušiť rez.' : 'Cancel booking'}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
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
                        }}
                        className="gap-1.5 rounded-[16px] border-[var(--glass-border-subtle)] bg-white/70 text-[hsl(var(--soft-navy))]"
                      >
                        <X className="h-3.5 w-3.5" />
                        {isSlovak ? 'Zrušiť' : 'Cancel'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-1.5 rounded-[16px] border border-white/20 bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] shadow-[0_16px_30px_rgba(79,149,213,0.22)] hover:brightness-[1.03]"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {isSaving ? '...' : (isSlovak ? 'Uložiť' : 'Save')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {isSlovak ? 'Vytvorené' : 'Created'}:{' '}
                      {booking.created_at && format(new Date(booking.created_at), 'd. MMMM yyyy • HH:mm', { locale: isSlovak ? sk : undefined })}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-1.5 rounded-[16px] border-[var(--glass-border-subtle)] bg-white/70 text-[hsl(var(--soft-navy))] hover:bg-white/82 hover:text-[hsl(var(--navy))]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
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
