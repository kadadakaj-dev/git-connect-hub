import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingData, BookingStep, Service } from '@/types/booking';
import ProgressBar from './ProgressBar';
import ServiceSelection from './ServiceSelection';
import DateTimeSelection from './DateTimeSelection';
import ClientDetails from './ClientDetails';
import Confirmation from './Confirmation';
import Footer from '../Footer';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCreateBooking } from '@/hooks/useCreateBooking';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createBooking = useCreateBooking();

  const steps: BookingStep[] = [
    { id: 1, title: t.steps.service.title, description: t.steps.service.description },
    { id: 2, title: t.steps.dateTime.title, description: t.steps.dateTime.description },
    { id: 3, title: t.steps.details.title, description: t.steps.details.description },
    { id: 4, title: t.steps.confirm.title, description: t.steps.confirm.description },
  ];

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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!bookingData.service) {
          toast.error(t.errors.selectService);
          return false;
        }
        break;
      case 1:
        if (!bookingData.date) {
          toast.error(t.errors.selectDate);
          return false;
        }
        if (!bookingData.time) {
          toast.error(t.errors.selectTime);
          return false;
        }
        break;
      case 2:
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
          return false;
        }
        break;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 2) {
      try {
        await createBooking.mutateAsync({
          serviceId: bookingData.service!.id,
          date: bookingData.date!,
          timeSlot: bookingData.time!,
          clientName: bookingData.clientName,
          clientEmail: bookingData.clientEmail,
          clientPhone: bookingData.clientPhone,
          notes: bookingData.notes || undefined,
        });
        toast.success(t.bookingSuccess);
        setCurrentStep((prev) => prev + 1);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Booking failed';
        toast.error(message);
        return;
      }
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleNewBooking = () => {
    setCurrentStep(0);
    setBookingData(initialBookingData);
    setErrors({});
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!bookingData.service;
      case 1:
        return !!bookingData.date && !!bookingData.time;
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/8 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -left-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-24 right-1/4 w-56 h-56 bg-accent/40 rounded-full blur-3xl" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-6 md:py-10 flex-1 relative z-10">
        {/* Header */}
        <header className="text-center mb-6 sm:mb-8 md:mb-10 animate-fade-in-up relative">
          {/* Client Portal Link */}
          <div className="absolute top-0 right-0">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to="/auth">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {language === 'sk' ? 'Klientský portál' : 'Client Portal'}
                </span>
              </Link>
            </Button>
          </div>

          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/12 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4 hover:bg-primary/18 transition-colors cursor-default">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t.clinicSubtitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-2 sm:mb-3 tracking-tight">
            {t.clinicName}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Profesionálna starostlivosť o vaše zdravie
          </p>
        </header>

        {/* Progress Bar */}
        {currentStep < 3 && (
          <div className="mb-6 sm:mb-8">
            <ProgressBar steps={steps.slice(0, 3)} currentStep={currentStep} />
          </div>
        )}

        {/* Step Content */}
        <main className="mt-4 sm:mt-6">
          {currentStep === 0 && (
            <ServiceSelection
              selectedService={bookingData.service}
              onSelect={(service) => updateBookingData('service', service)}
            />
          )}

          {currentStep === 1 && (
            <DateTimeSelection
              selectedDate={bookingData.date}
              selectedTime={bookingData.time}
              onDateSelect={(date) => updateBookingData('date', date)}
              onTimeSelect={(time) => updateBookingData('time', time)}
            />
          )}

          {currentStep === 2 && (
            <ClientDetails
              clientName={bookingData.clientName}
              clientEmail={bookingData.clientEmail}
              clientPhone={bookingData.clientPhone}
              notes={bookingData.notes}
              onUpdate={updateBookingData}
              errors={errors}
            />
          )}

          {currentStep === 3 && (
            <Confirmation
              bookingData={bookingData}
              onNewBooking={handleNewBooking}
            />
          )}
        </main>

        {/* Navigation Buttons */}
        {currentStep < 3 && (
          <nav className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-border/40">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2 order-2 sm:order-1 w-full sm:w-auto h-11 sm:h-10 hover:bg-primary/10 active:scale-[0.98] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Button>

            <Button
              variant="booking"
              size="lg"
              onClick={handleNext}
              disabled={!canProceed() || createBooking.isPending}
              className="gap-2 min-w-[160px] sm:min-w-[180px] order-1 sm:order-2 w-full sm:w-auto h-12 sm:h-11"
            >
              {createBooking.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-navy-foreground/30 border-t-navy-foreground rounded-full animate-spin" />
                  {t.booking}
                </>
              ) : currentStep === 2 ? (
                t.confirmBooking
              ) : (
                <>
                  {t.continue}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </nav>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BookingWizard;
