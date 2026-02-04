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
      <div className="mb-6 sm:mb-8">
        <div className="relative inline-block">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-success/12 flex items-center justify-center mx-auto mb-4 sm:mb-5 animate-pulse-soft">
            <CheckCircle2 className="w-10 h-10 sm:w-14 sm:h-14 text-success" />
          </div>
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/15 flex items-center justify-center animate-bounce-subtle">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-2 sm:mb-3">
          {t.bookingConfirmed}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-sm mx-auto">
          {t.appointmentScheduled}
        </p>
      </div>

      {/* Booking Details Card */}
      <div className="max-w-lg mx-auto glass-card rounded-2xl p-5 sm:p-6 md:p-8 text-left">
        <div className="flex items-center justify-between mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-border/40">
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.confirmationNumber}</p>
            <p className="text-lg sm:text-xl font-bold text-foreground font-mono">
              #{Math.random().toString(36).substring(2, 8).toUpperCase()}
            </p>
          </div>
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-success/12 text-success text-xs sm:text-sm font-semibold">
            {t.confirmed}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {/* Service */}
          <div className="flex items-start gap-3 sm:gap-4 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/12 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t.service}</p>
              <p className="font-semibold text-foreground text-base sm:text-lg truncate">{service?.name}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{service?.duration} {t.min} • {service?.price}€</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3 sm:gap-4 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/12 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t.dateAndTime}</p>
              <p className="font-semibold text-foreground text-base sm:text-lg">
                {date && format(date, 'EEEE, d. MMMM yyyy', { locale })}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {time}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3 sm:gap-4 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/12 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t.location}</p>
              <p className="font-semibold text-foreground text-base sm:text-lg">{t.clinicName}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.clinicAddress}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="pt-4 sm:pt-5 border-t border-border/40 space-y-2.5 sm:space-y-3">
            <div className="flex items-center gap-2.5 sm:gap-3 text-sm group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted/50 flex items-center justify-center transition-colors duration-200 group-hover:bg-primary/10">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-foreground text-sm font-medium">{clientName}</span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3 text-sm group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted/50 flex items-center justify-center transition-colors duration-200 group-hover:bg-primary/10">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-foreground text-sm">{clientEmail}</span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3 text-sm group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted/50 flex items-center justify-center transition-colors duration-200 group-hover:bg-primary/10">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-foreground text-sm">{clientPhone}</span>
            </div>
          </div>

          {notes && (
            <div className="pt-4 sm:pt-5 border-t border-border/40">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-2">{t.notes}</p>
              <p className="text-xs sm:text-sm text-foreground bg-muted/30 rounded-xl p-3">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Email Notice */}
      <div className="max-w-lg mx-auto mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-xl bg-primary/8 border border-primary/15">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t.emailSentTo} <span className="font-semibold text-foreground">{clientEmail}</span>
        </p>
      </div>

      {/* Action Button */}
      <div className="mt-6 sm:mt-8">
        <Button
          variant="ghost"
          size="lg"
          onClick={onNewBooking}
          className="gap-2 hover:bg-primary/10 active:scale-[0.98] transition-all h-11"
        >
          {t.bookAnotherAppointment}
        </Button>
      </div>
    </div>
  );
};

export default Confirmation;
