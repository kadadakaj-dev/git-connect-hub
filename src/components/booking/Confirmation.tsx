import { format } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import { CheckCircle2, Calendar, Clock, User, Mail, Phone, FileText, MapPin } from 'lucide-react';
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
      <div className="mb-6">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {t.bookingConfirmed}
        </h2>
        <p className="text-muted-foreground">
          {t.appointmentScheduled}
        </p>
      </div>

      {/* Booking Details Card */}
      <div className="max-w-lg mx-auto bg-card rounded-xl border border-border p-6 md:p-8 shadow-elegant text-left">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
          <div>
            <p className="text-sm text-muted-foreground">{t.confirmationNumber}</p>
            <p className="text-lg font-bold text-foreground">
              #{Math.random().toString(36).substring(2, 8).toUpperCase()}
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
            {t.confirmed}
          </div>
        </div>

        <div className="space-y-4">
          {/* Service */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.service}</p>
              <p className="font-medium text-foreground">{service?.name}</p>
              <p className="text-sm text-muted-foreground">{service?.duration} {t.min} • ${service?.price}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.dateAndTime}</p>
              <p className="font-medium text-foreground">
                {date && format(date, 'EEEE, d. MMMM yyyy', { locale })}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {time}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.location}</p>
              <p className="font-medium text-foreground">{t.clinicName}</p>
              <p className="text-sm text-muted-foreground">{t.clinicAddress}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{clientName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{clientEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{clientPhone}</span>
            </div>
          </div>

          {notes && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">{t.notes}</p>
              <p className="text-sm text-foreground">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Email Notice */}
      <div className="max-w-lg mx-auto mt-6 p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground">
          {t.emailSentTo} <span className="font-medium text-foreground">{clientEmail}</span>
        </p>
      </div>

      {/* Action Button */}
      <div className="mt-8">
        <Button
          variant="subtle"
          size="lg"
          onClick={onNewBooking}
        >
          {t.bookAnotherAppointment}
        </Button>
      </div>
    </div>
  );
};

export default Confirmation;
