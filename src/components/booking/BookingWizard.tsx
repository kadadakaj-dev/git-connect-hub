import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone, Mail, Check, FileText, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingData, Service } from '@/types/booking';
import ServiceSelection from './ServiceSelection';
import DateTimeSelection from './DateTimeSelection';
import Confirmation from './Confirmation';
import Footer from '../Footer';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCreateBooking } from '@/hooks/useCreateBooking';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';

const initialBookingData: BookingData = {
  service: null,
  date: null,
  time: null,
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  notes: '',
};

const BookingWizard = () => {
  const { t, language } = useLanguage();
  const locale = language === 'sk' ? sk : enUS;
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const createBooking = useCreateBooking();

  const dateTimeRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const updateBookingData = (field: string, value: any) => {
    setBookingData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleServiceSelect = (service: Service) => {
    updateBookingData('service', service);
    setTimeout(() => {
      dateTimeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  const handleTimeSelect = (time: string) => {
    updateBookingData('time', time);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  const isFieldValid = (field: string, value: string) => {
    if (!value.trim()) return null;
    switch (field) {
      case 'clientName': return value.trim().length >= 2;
      case 'clientEmail': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'clientPhone': return /^[\+]?[0-9\s\-\(\)]{7,20}$/.test(value.trim());
      default: return null;
    }
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!bookingData.clientName.trim() || bookingData.clientName.trim().length < 2) {
      newErrors.clientName = t.errors.nameRequired;
    }
    if (!bookingData.clientEmail.trim()) {
      newErrors.clientEmail = t.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.clientEmail)) {
      newErrors.clientEmail = t.errors.emailInvalid;
    }
    if (!bookingData.clientPhone.trim()) {
      newErrors.clientPhone = t.errors.phoneRequired;
    } else if (!/^[\+]?[0-9\s\-\(\)]{7,20}$/.test(bookingData.clientPhone.trim())) {
      newErrors.clientPhone = t.errors.phoneRequired;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!bookingData.service || !bookingData.date || !bookingData.time) {
      toast.error(language === 'sk' ? 'Vyplňte všetky povinné polia' : 'Fill in all required fields');
      return;
    }

    try {
      await createBooking.mutateAsync({
        serviceId: bookingData.service.id,
        date: bookingData.date,
        timeSlot: bookingData.time,
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        clientPhone: bookingData.clientPhone,
        notes: bookingData.notes || undefined,
      });
      toast.success(t.bookingSuccess);
      setIsConfirmed(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Booking failed';
      toast.error(message);
    }
  };

  const handleNewBooking = () => {
    setBookingData(initialBookingData);
    setErrors({});
    setIsConfirmed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasService = !!bookingData.service;
  const hasDateTime = !!bookingData.date && !!bookingData.time;

  const inputClasses = (field: string) => {
    const hasError = !!errors[field];
    return cn(
      "w-full pl-8 pr-8 py-2 rounded-md border bg-card text-foreground text-sm",
      "placeholder:text-muted-foreground/40 transition-all duration-200",
      "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20",
      hasError
        ? "border-destructive/50 bg-destructive/5"
        : "border-border/60 hover:border-muted-foreground/30"
    );
  };

  const renderField = (
    field: string,
    icon: React.ElementType,
    placeholder: string,
    type: string,
    value: string,
    autoComplete?: string
  ) => {
    const Icon = icon;
    const hasError = !!errors[field];
    const isValid = isFieldValid(field, value);
    const isFocused = focusedField === field;

    return (
      <div>
        <div className="relative">
          <Icon className={cn(
            "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200",
            isFocused ? "text-primary" : hasError ? "text-destructive" : "text-muted-foreground"
          )} />
          <input
            id={field}
            type={type}
            value={value}
            onChange={(e) => updateBookingData(field, e.target.value)}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
            placeholder={placeholder}
            className={inputClasses(field)}
            autoComplete={autoComplete}
          />
          <div className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 transition-all duration-200",
            (isValid !== null || hasError) ? "opacity-100" : "opacity-0"
          )}>
            {hasError ? (
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            ) : isValid === true ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            ) : null}
          </div>
        </div>
        {hasError && (
          <p className="text-[11px] text-destructive mt-0.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-destructive" />
            {errors[field]}
          </p>
        )}
      </div>
    );
  };

  // Shared header
  const renderHeader = () => (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/60">
      <div className="container max-w-2xl mx-auto px-4 h-11 flex items-center justify-between">
        <a href="https://booking.fyzioafit.sk" className="text-sm font-bold text-foreground tracking-tight hover:text-primary transition-colors">FYZIO&FIT</a>
        <div className="flex items-center gap-3">
          <a href="tel:+421905307198" className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            <Phone className="w-3 h-3" />
            <span>+421 905 307 198</span>
          </a>
          <a href="mailto:booking@fyzioafit.sk" className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="w-3 h-3" />
            <span>booking@fyzioafit.sk</span>
          </a>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-foreground h-7 px-2">
            <Link to="/auth">
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px] font-medium">
                {language === 'sk' ? 'Klientský portál' : 'Client Portal'}
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {renderHeader()}
        <div className="container max-w-2xl mx-auto px-4 py-6 flex-1">
          <Confirmation bookingData={bookingData} onNewBooking={handleNewBooking} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {renderHeader()}

      <div className="container max-w-2xl mx-auto px-4 py-4 flex-1">
        {/* Step 1: Service */}
        <section className="mb-5">
          <SectionHeader number={1} title={language === 'sk' ? 'Vyberte službu' : 'Select service'} completed={hasService} />
          <div className="mt-2">
            <ServiceSelection
              selectedService={bookingData.service}
              onSelect={handleServiceSelect}
            />
          </div>
        </section>

        {/* Step 2 & 3: Date & Time side by side */}
        <section ref={dateTimeRef} className={cn("mb-5 transition-opacity duration-300", !hasService && "opacity-30 pointer-events-none")}>
          <div className="flex items-center gap-6 mb-2">
            <SectionHeader number={2} title={language === 'sk' ? 'Vyberte dátum' : 'Select date'} completed={!!bookingData.date} />
            <SectionHeader number={3} title={language === 'sk' ? 'Vyberte čas' : 'Select time'} completed={!!bookingData.time} />
          </div>
          <div className="mt-2">
            <DateTimeSelection
              selectedDate={bookingData.date}
              selectedTime={bookingData.time}
              onDateSelect={(date) => updateBookingData('date', date)}
              onTimeSelect={handleTimeSelect}
              serviceDuration={bookingData.service?.duration}
            />
          </div>
        </section>

        {/* Step 4: Client Details */}
        <section ref={detailsRef} className={cn("mb-4 transition-opacity duration-300", !hasDateTime && "opacity-30 pointer-events-none")}>
          <SectionHeader number={4} title={language === 'sk' ? 'Vyplňte Vaše údaje' : 'Your details'} completed={false} />
          <div className="mt-2 space-y-2">
            {renderField('clientName', User, t.fullNamePlaceholder, 'text', bookingData.clientName, 'name')}
            {renderField('clientEmail', Mail, t.emailPlaceholder, 'email', bookingData.clientEmail, 'email')}
            {renderField('clientPhone', Phone, t.phonePlaceholder, 'tel', bookingData.clientPhone, 'tel')}

            {/* Notes */}
            <div className="relative">
              <FileText className={cn(
                "absolute left-2.5 top-2.5 w-3.5 h-3.5 transition-colors duration-200",
                focusedField === 'notes' ? "text-primary" : "text-muted-foreground"
              )} />
              <textarea
                id="notes"
                value={bookingData.notes}
                onChange={(e) => updateBookingData('notes', e.target.value)}
                onFocus={() => setFocusedField('notes')}
                onBlur={() => setFocusedField(null)}
                placeholder={t.notesPlaceholder}
                rows={2}
                className={cn(
                  "w-full pl-8 pr-3 py-2 rounded-md border bg-card text-foreground text-sm resize-none",
                  "placeholder:text-muted-foreground/40 transition-all duration-200",
                  "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20",
                  "border-border/60 hover:border-muted-foreground/30"
                )}
              />
            </div>

            {/* GDPR */}
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-primary flex-shrink-0" />
              <p className="text-[10px] text-muted-foreground">
                {language === 'sk' ? 'GDPR • Vaše údaje sú chránené' : 'GDPR • Your data is protected'}
              </p>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="pb-6">
          <Button
            variant="default"
            size="lg"
            onClick={handleSubmit}
            disabled={!hasService || !hasDateTime || createBooking.isPending}
            className="w-full gap-2 rounded-full text-sm font-semibold h-11"
          >
            {createBooking.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>{t.booking}</span>
              </>
            ) : (
              <span>{language === 'sk' ? 'Rezervovať' : 'Book now'}</span>
            )}
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const SectionHeader = ({
  number,
  title,
  completed,
}: {
  number: number;
  title: string;
  completed: boolean;
}) => (
  <div className="flex items-center gap-2">
    <div className={cn(
      "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0",
      completed
        ? "bg-primary text-primary-foreground"
        : "bg-primary/15 text-primary border border-primary/30"
    )}>
      {completed ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : number}
    </div>
    <span className="text-sm font-semibold text-foreground">{title}</span>
  </div>
);

export default BookingWizard;
