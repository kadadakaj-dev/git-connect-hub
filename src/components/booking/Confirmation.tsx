import { format } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import { CheckCircle2, Calendar, Clock, User, Mail, Phone, FileText, MapPin, Sparkles } from 'lucide-react';
import { BookingData } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

interface ConfirmationProps {
  bookingData: BookingData;
  onNewBooking: () => void;
}

const Confirmation = ({ bookingData, onNewBooking }: ConfirmationProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'sk' ? sk : enUS;
  const { service, date, time, clientName, clientEmail, clientPhone, notes } = bookingData;

  return (
    <div className="animate-scale-in text-center">
      {/* Success Icon */}
      <div className="mb-8">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5 animate-pulse-ring">
            <CheckCircle2 className="w-14 h-14 text-success" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          {t.bookingConfirmed}
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
          {t.appointmentScheduled}
        </p>
      </div>

      {/* Booking Details Card */}
      <div className="max-w-lg mx-auto glass-card rounded-2xl p-6 md:p-8 text-left">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-border/50">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.confirmationNumber}</p>
            <p className="text-xl font-bold text-foreground font-mono">
              #{Math.random().toString(36).substring(2, 8).toUpperCase()}
            </p>
          </div>
          <div className="px-4 py-2 rounded-full bg-success/10 text-success text-sm font-semibold">
            {t.confirmed}
          </div>
        </div>

        <div className="space-y-5">
          {/* Service */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.service}</p>
              <p className="font-semibold text-foreground text-lg">{service?.name}</p>
              <p className="text-sm text-muted-foreground">{service?.duration} {t.min} • {service?.price}€</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.dateAndTime}</p>
              <p className="font-semibold text-foreground text-lg">
                {date && format(date, 'EEEE, d. MMMM yyyy', { locale })}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {time}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.location}</p>
              <p className="font-semibold text-foreground text-lg">{t.clinicName}</p>
              <p className="text-sm text-muted-foreground">{t.clinicAddress}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="pt-5 border-t border-border/50 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-foreground font-medium">{clientName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-foreground">{clientEmail}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                <Phone className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-foreground">{clientPhone}</span>
            </div>
          </div>

          {notes && (
            <div className="pt-5 border-t border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{t.notes}</p>
              <p className="text-sm text-foreground bg-muted/30 rounded-xl p-3">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Email Notice */}
      <div className="max-w-lg mx-auto mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-sm text-muted-foreground">
          {t.emailSentTo} <span className="font-semibold text-foreground">{clientEmail}</span>
        </p>
      </div>

      {/* Action Button */}
      <div className="mt-8">
        <Button
          variant="ghost"
          size="lg"
          onClick={onNewBooking}
          className="gap-2"
        >
          {t.bookAnotherAppointment}
        </Button>
      </div>
    </div>
  );
};

export default Confirmation;
