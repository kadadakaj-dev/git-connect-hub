import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Calendar, Clock, Mail, MessageSquareText, Phone, User, UserRoundCheck, Timer, Tag, Banknote, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';

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
}

interface BookingDetailsDialogProps {
  booking: AdminBookingDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (booking: AdminBookingDetails) => void;
}

const BookingDetailsDialog = ({ booking, open, onOpenChange, onEdit }: BookingDetailsDialogProps) => {
  const { language } = useLanguage();

  const isSlovak = language === 'sk';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            {isSlovak ? 'Potvrdené' : 'Confirmed'}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
            {isSlovak ? 'Zrušené' : 'Cancelled'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
            {isSlovak ? 'Čakajúce' : 'Pending'}
          </Badge>
        );
    }
  };

  const serviceName = booking?.services
    ? (isSlovak ? booking.services.name_sk : booking.services.name_en)
    : (isSlovak ? 'Bez služby' : 'No service');
  const employeeName = booking?.employees?.full_name || (isSlovak ? 'Nepriradený' : 'Unassigned');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-[28px] border-[var(--glass-border)] bg-[var(--glass-white-lg)] shadow-glass-float">
        {booking && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <DialogTitle className="text-[hsl(var(--soft-navy))]">
                    {isSlovak ? 'Detail rezervácie' : 'Booking details'}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {serviceName}
                  </DialogDescription>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-4 shadow-[0_12px_24px_rgba(126,195,255,0.08)]">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {isSlovak ? 'Klient' : 'Client'}
                  </p>
                  <div className="space-y-2.5">
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
                  </div>
                </div>

                <div className="rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-4 shadow-[0_12px_24px_rgba(126,195,255,0.08)]">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {isSlovak ? 'Termín' : 'Appointment'}
                  </p>
                  <div className="space-y-2.5">
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
                  </div>
                </div>
              </div>

              {/* Service details */}
              {booking.services && (booking.services.category || booking.services.price != null) && (
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

              <div className="rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-4 shadow-[0_12px_24px_rgba(126,195,255,0.08)]">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {isSlovak ? 'Poznámka klienta' : 'Client note'}
                </p>
                <div className="flex items-start gap-2">
                  <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-[hsl(var(--soft-navy))]">
                    {booking.notes?.trim() || (isSlovak ? 'Bez poznámky' : 'No note provided')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {isSlovak ? 'Vytvorené' : 'Created'}:{' '}
                  {booking.created_at && format(new Date(booking.created_at), 'd. MMMM yyyy • HH:mm', { locale: isSlovak ? sk : undefined })}
                </p>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(booking);
                    }}
                    className="gap-1.5 rounded-[16px] border-[var(--glass-border-subtle)] bg-white/70 text-[hsl(var(--soft-navy))] hover:bg-white/82 hover:text-[hsl(var(--navy))]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {isSlovak ? 'Upraviť' : 'Edit'}
                  </Button>
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
