import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone, Mail, Check, ChevronDown, FileText, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
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
      "w-full pl-9 pr-9 py-2 rounded-md border bg-card text-foreground text-sm",
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
    label: string,
    type: string,
    placeholder: string,
    value: string,
    autoComplete?: string
  ) => {
    const Icon = icon;
    const hasError = !!errors[field];
    const isValid = isFieldValid(field, value);
    const isFocused = focusedField === field;

    return (
      <div>
        <label htmlFor={field} className={cn(
          "block text-[11px] font-medium mb-1 transition-colors duration-200",
          isFocused ? "text-primary" : "text-foreground"
        )}>
          {label} <span className="text-primary">{t.required}</span>
        </label>
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
          <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-destructive" />
            {errors[field]}
          </p>
        )}
      </div>
    );
  };

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/60">
          <div className="container max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
            <span className="text-base font-bold text-foreground tracking-tight">FYZIO&FIT</span>
            <div className="flex items-center gap-3">
              <a href="tel:+421905307198" className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="w-3 h-3" />
                <span>+421 905 307 198</span>
              </a>
              <a href="mailto:booking@fyzioafit.sk" className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-3 h-3" />
                <span>booking@fyzioafit.sk</span>
              </a>
            </div>
          </div>
        </header>
        <div className="container max-w-3xl mx-auto px-4 py-6 flex-1">
          <Confirmation bookingData={bookingData} onNewBooking={handleNewBooking} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/60">
        <div className="container max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="text-base font-bold text-foreground tracking-tight">FYZIO&FIT</span>
          <div className="flex items-center gap-3">
            <a href="tel:+421905307198" className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="w-3 h-3" />
              <span>+421 905 307 198</span>
            </a>
            <a href="mailto:booking@fyzioafit.sk" className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-3 h-3" />
              <span>booking@fyzioafit.sk</span>
            </a>
            <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2">
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

      <div className="container max-w-3xl mx-auto px-4 py-5 flex-1">
        {/* Compact Hero */}
        <div className="text-center mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {language === 'sk' ? 'Rezervuj si termín' : 'Book your appointment'}
          </h1>
        </div>

        {/* Step 1: Service Selection */}
        <section className="mb-4">
          <SectionHeader
            number={1}
            title={t.steps.service.title}
            completed={hasService}
            summary={hasService ? `${bookingData.service!.name} • ${bookingData.service!.price}€` : undefined}
          />
          <div className="mt-3">
            <ServiceSelection
              selectedService={bookingData.service}
              onSelect={handleServiceSelect}
            />
          </div>
        </section>

        {/* Step 2: Date & Time */}
        <section ref={dateTimeRef} className={cn("mb-4 transition-opacity duration-300", !hasService && "opacity-40 pointer-events-none")}>
          <SectionHeader
            number={2}
            title={t.steps.dateTime.title}
            completed={hasDateTime}
            summary={hasDateTime ? `${format(bookingData.date!, 'd. MMM', { locale })} • ${bookingData.time}` : undefined}
          />
          <div className="mt-3">
            <DateTimeSelection
              selectedDate={bookingData.date}
              selectedTime={bookingData.time}
              onDateSelect={(date) => updateBookingData('date', date)}
              onTimeSelect={handleTimeSelect}
            />
          </div>
        </section>

        {/* Step 3: Client Details */}
        <section ref={detailsRef} className={cn("mb-6 transition-opacity duration-300", !hasDateTime && "opacity-40 pointer-events-none")}>
          <SectionHeader
            number={3}
            title={t.steps.details.title}
            completed={false}
          />
          <div className="mt-3">
            <div className="bg-card border border-border/60 rounded-lg p-4 shadow-soft space-y-3">
              {renderField('clientName', User, t.fullName, 'text', t.fullNamePlaceholder, bookingData.clientName, 'name')}
              {renderField('clientEmail', Mail, t.emailAddress, 'email', t.emailPlaceholder, bookingData.clientEmail, 'email')}
              {renderField('clientPhone', Phone, t.phoneNumber, 'tel', t.phonePlaceholder, bookingData.clientPhone, 'tel')}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className={cn(
                  "block text-[11px] font-medium mb-1 transition-colors duration-200",
                  focusedField === 'notes' ? "text-primary" : "text-foreground"
                )}>
                  {t.additionalNotes}
                  <span className="text-muted-foreground ml-1">({t.optional})</span>
                </label>
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
                      "w-full pl-9 pr-3 py-2 rounded-md border bg-card text-foreground text-sm resize-none",
                      "placeholder:text-muted-foreground/40 transition-all duration-200",
                      "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20",
                      "border-border/60 hover:border-muted-foreground/30"
                    )}
                  />
                </div>
              </div>

              {/* GDPR */}
              <div className="flex items-center gap-2 pt-1">
                <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <p className="text-[10px] text-muted-foreground">
                  {language === 'sk' ? 'GDPR • Vaše údaje sú chránené' : 'GDPR • Your data is protected'}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-4">
              <Button
                variant="default"
                size="lg"
                onClick={handleSubmit}
                disabled={!hasService || !hasDateTime || createBooking.isPending}
                className="w-full gap-2"
              >
                {createBooking.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>{t.booking}</span>
                  </>
                ) : (
                  <span>{t.confirmBooking}</span>
                )}
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

// Section header component
const SectionHeader = ({
  number,
  title,
  completed,
  summary,
}: {
  number: number;
  title: string;
  completed: boolean;
  summary?: string;
}) => (
  <div className="flex items-center gap-2.5">
    <div className={cn(
      "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0",
      completed
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground border border-border/60"
    )}>
      {completed ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : number}
    </div>
    <span className="text-sm font-semibold text-foreground">{title}</span>
    {summary && (
      <span className="text-xs text-muted-foreground ml-auto truncate max-w-[180px]">{summary}</span>
    )}
  </div>
);

export default BookingWizard;
