import { useState } from 'react';
import { format } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import { CheckCircle2, Calendar, Clock, User, Mail, Phone, MapPin, ArrowRight, CalendarPlus } from 'lucide-react';
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

  // Stable confirmation code — generated once per mount
  const [confirmationCode] = useState(() =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

  const handleAddToCalendar = () => {
    if (date && time && service) {
      const title = `FYZIO&FIT - ${service.name}`;
      const startDate = new Date(date);
      const [hours, minutes] = time.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes));
      const endDate = new Date(startDate.getTime() + (service.duration || 60) * 60000);
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(language === 'sk' ? 'Rezervácia fyzioterapie' : 'Physiotherapy appointment')}&location=${encodeURIComponent('Krmanová 6, Košice')}`;
      window.open(googleCalendarUrl, '_blank');
    }
  };

  return (
    <div className="animate-fade-in-up max-w-lg mx-auto">
      {/* Receipt Card */}
      <div className="rounded-2xl overflow-hidden backdrop-blur-xl bg-[var(--glass-white)] border border-[var(--glass-border)] shadow-glass relative">
        {/* Reflection */}
        <div className="absolute inset-0 bg-[var(--reflection-top)] pointer-events-none rounded-[inherit] z-[1]" />
        
        {/* Top accent gradient */}
        <div className="h-[2px] bg-gradient-to-r from-primary via-[#b490f5] to-[#f7a8c4] relative z-[2]" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--glass-border-subtle)] relative z-[2]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.bookingConfirmed}</h2>
              <p className="text-xs text-muted-foreground">{t.appointmentScheduled}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.confirmationNumber}</span>
            <span className="text-sm font-bold font-data text-foreground">#{confirmationCode}</span>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-4 text-sm relative z-[2]">
          {/* Service */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{t.service}</p>
              <p className="font-semibold text-foreground">{service?.name}</p>
              <p className="text-xs text-muted-foreground">{service?.duration} {t.min}</p>
            </div>
            <span className="font-bold font-data text-foreground">{service?.price}€</span>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-6 py-3 px-4 rounded-xl backdrop-blur-sm bg-[var(--glass-white)] border border-[var(--glass-border-subtle)]">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground">
                {date && format(date, 'd. MMM yyyy', { locale })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="font-data text-foreground">{time}</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs">Krmanová 6, Košice</span>
          </div>

          {/* Client */}
          <div className="pt-3 border-t border-[var(--glass-border-subtle)] space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-foreground">{clientName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-foreground">{clientEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-data text-foreground">{clientPhone}</span>
            </div>
          </div>

          {notes && (
            <div className="pt-3 border-t border-[var(--glass-border-subtle)]">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t.notes}</p>
              <p className="text-xs text-foreground bg-[var(--glass-white)] backdrop-blur-sm border border-[var(--glass-border-subtle)] rounded-xl p-2.5">{notes}</p>
            </div>
          )}
        </div>

        {/* Email notice */}
        <div className="px-6 py-3 bg-[var(--glass-white)] border-t border-[var(--glass-border-subtle)] relative z-[2]">
          <p className="text-xs text-muted-foreground text-center">
            {t.emailSentTo} <span className="font-medium text-foreground">{clientEmail}</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button variant="default" size="lg" onClick={onNewBooking} className="w-full sm:w-auto gap-2 rounded-xl">
          <span>{t.bookAnotherAppointment}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button variant="glass" size="lg" onClick={handleAddToCalendar} className="w-full sm:w-auto gap-2 rounded-xl">
          <CalendarPlus className="w-4 h-4" />
          <span>{language === 'sk' ? 'Pridať do kalendára' : 'Add to Calendar'}</span>
        </Button>
      </div>
    </div>
  );
};

export default Confirmation;
