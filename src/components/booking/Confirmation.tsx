import { format } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import { CheckCircle2, Calendar, Clock, User, Mail, Phone, MapPin, ArrowRight, CalendarPlus } from 'lucide-react';
import { BookingData } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

interface ConfirmationProps {
  bookingData: BookingData;
  onNewBooking: () => void;
  bookingId?: string;
}

const Confirmation = ({ bookingData, onNewBooking, bookingId }: ConfirmationProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'sk' ? sk : enUS;
  const { service, date, time, clientName, clientEmail, clientPhone, notes } = bookingData;

  // Use first 8 chars of booking ID if available, otherwise generate fallback
  const confirmationCode = bookingId
    ? bookingId.substring(0, 8).toUpperCase()
    : Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleAddToCalendar = () => {
    if (date && time && service) {
      const title = `FYZIO&FIT - ${service.name}`;
      const startDate = new Date(date);
      const [hours, minutes] = time.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const endDate = new Date(startDate.getTime() + (service.duration || 60) * 60000);
      
      // Format dates for Google Calendar in local time
      const formatLocalDate = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
      };
      
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatLocalDate(startDate)}/${formatLocalDate(endDate)}&ctz=Europe/Bratislava&details=${encodeURIComponent(language === 'sk' ? 'Rezervácia fyzioterapie' : 'Physiotherapy appointment')}&location=${encodeURIComponent('Krmanová 6, Košice')}`;
      window.open(googleCalendarUrl, '_blank');
    }
  };

  const handleDownloadICS = () => {
    if (date && time && service) {
      const title = `FYZIO&FIT - ${service.name}`;
      const startDate = new Date(date);
      const [hours, minutes] = time.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const endDate = new Date(startDate.getTime() + (service.duration || 60) * 60000);

      const formatICSDate = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PROID:-//FYZIO&FIT//Booking System//SK',
        'BEGIN:VEVENT',
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${language === 'sk' ? 'Rezervácia fyzioterapie' : 'Physiotherapy appointment'}`,
        'LOCATION:Krmanová 6, Košice',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'fyzio-fit-appointment.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

          {/* Provider Branding */}
          <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-primary/5 border border-primary/10">
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="text-[13px] font-medium text-foreground">
              {language === 'sk' ? 'Personál FYZIO&FIT' : 'Staff of FYZIO&FIT'}
            </span>
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
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="default" size="lg" onClick={onNewBooking} className="w-full gap-2 rounded-xl">
          <span>{t.bookAnotherAppointment}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="glass" size="lg" onClick={handleAddToCalendar} className="flex-1 gap-2 rounded-xl text-xs sm:text-sm">
            <CalendarPlus className="w-4 h-4" />
            <span>Google</span>
          </Button>
          <Button variant="glass" size="lg" onClick={handleDownloadICS} className="flex-1 gap-2 rounded-xl text-xs sm:text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Apple / Outlook</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
