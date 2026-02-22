import { format } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  MapPin, 
  Sparkles,
  PartyPopper,
  ArrowRight,
  CalendarPlus
} from 'lucide-react';
import { BookingData } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface ConfirmationProps {
  bookingData: BookingData;
  onNewBooking: () => void;
}

const Confirmation = ({ bookingData, onNewBooking }: ConfirmationProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'sk' ? sk : enUS;
  const { service, date, time, clientName, clientEmail, clientPhone, notes } = bookingData;

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
    <div className="animate-scale-in text-center">
      {/* Success Icon */}
      <div className="mb-8 sm:mb-10">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-primary/30 animate-pulse" />
          
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/30 animate-scale-in">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" strokeWidth={2.5} />
          </div>
          
          <PartyPopper className="absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 text-amber-500 animate-bounce-subtle" />
          <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient mb-3">
          {t.bookingConfirmed}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
          {t.appointmentScheduled}
        </p>
      </div>

      {/* Booking Details Card */}
      <div className="max-w-lg mx-auto glass-premium rounded-2xl overflow-hidden shadow-elevated">
        <div className="bg-primary/10 px-5 sm:px-6 py-4 sm:py-5 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">{t.confirmationNumber}</p>
              <p className="text-lg sm:text-xl font-bold text-foreground font-data">
                #{Math.random().toString(36).substring(2, 8).toUpperCase()}
              </p>
            </div>
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/15 text-primary text-xs sm:text-sm font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.confirmed}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 md:p-8 text-left space-y-4 sm:space-y-5">
          {/* Service */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border-l-2 border-primary group hover:bg-primary/10 transition-all duration-300">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t.service}</p>
              <p className="font-semibold text-primary text-base sm:text-lg truncate">{service?.name}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{service?.duration} {t.min} • <span className="font-bold text-foreground font-data">{service?.price}€</span></p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-4 group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t.dateAndTime}</p>
              <p className="font-semibold text-foreground text-base sm:text-lg">
                {date && format(date, 'EEEE, d. MMMM yyyy', { locale })}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 font-data">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {time}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-4 group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{t.location}</p>
              <p className="font-semibold text-foreground text-base sm:text-lg">{t.clinicName}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.clinicAddress}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="pt-5 border-t border-border/30 space-y-3 stagger-fade">
            <div className="flex items-center gap-3 text-sm group hover:bg-muted/20 p-2 -mx-2 rounded-lg transition-all duration-300">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-foreground font-medium">{clientName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm group hover:bg-muted/20 p-2 -mx-2 rounded-lg transition-all duration-300">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-foreground">{clientEmail}</span>
            </div>
            <div className="flex items-center gap-3 text-sm group hover:bg-muted/20 p-2 -mx-2 rounded-lg transition-all duration-300">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                <Phone className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-foreground font-data">{clientPhone}</span>
            </div>
          </div>

          {notes && (
            <div className="pt-5 border-t border-border/30">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-2">{t.notes}</p>
              <p className="text-xs sm:text-sm text-foreground bg-muted/20 rounded-xl p-3 border border-border/30">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Email Notice */}
      <div className="max-w-lg mx-auto mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t.emailSentTo} <span className="font-semibold text-foreground">{clientEmail}</span>
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <Button
          variant="booking"
          size="lg"
          onClick={onNewBooking}
          className="w-full sm:w-auto gap-2.5 group min-w-[180px]"
        >
          <span>{t.bookAnotherAppointment}</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={handleAddToCalendar}
          className="w-full sm:w-auto gap-2 hover:bg-primary/5 transition-all duration-300"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>{language === 'sk' ? 'Pridať do kalendára' : 'Add to Calendar'}</span>
        </Button>
      </div>
    </div>
  );
};

export default Confirmation;
