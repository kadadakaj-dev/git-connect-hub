import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Phone, Mail } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
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
        transitionToStep(currentStep + 1);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Booking failed';
        toast.error(message);
        return;
      }
    } else {
      transitionToStep(Math.min(currentStep + 1, steps.length - 1));
    }
  };

  const transitionToStep = (nextStep: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(nextStep);
      setIsTransitioning(false);
    }, 150);
  };

  const handleBack = () => {
    transitionToStep(Math.max(currentStep - 1, 0));
  };

  const handleNewBooking = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(0);
      setBookingData(initialBookingData);
      setErrors({});
      setIsTransitioning(false);
    }, 150);
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/60">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-foreground tracking-tight">
            FYZIO&FIT
          </span>
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="tel:+421905307198" className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="w-3.5 h-3.5" />
              <span>+421 905 307 198</span>
            </a>
            <a href="mailto:info@fyziofit.sk" className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-3.5 h-3.5" />
              <span>info@fyziofit.sk</span>
            </a>
            <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
              <Link to="/auth">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">
                  {language === 'sk' ? 'Klientský portál' : 'Client Portal'}
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex-1">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">
            FYZIO&FIT
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {language === 'sk' ? 'Rezervuj si termín' : 'Book your appointment'}
          </p>
        </div>

        {/* Progress Bar */}
        {currentStep < 3 && (
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <ProgressBar steps={steps.slice(0, 3)} currentStep={currentStep} />
          </div>
        )}

        {/* Step Content */}
        <main className={cn(
          "transition-all duration-200",
          isTransitioning && "opacity-0 translate-y-1"
        )}>
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
              bookingData={bookingData}
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
          <nav className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-border/40">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Button>

            <Button
              variant="default"
              size="lg"
              onClick={handleNext}
              disabled={!canProceed() || createBooking.isPending}
              className="gap-2 min-w-[160px]"
            >
              {createBooking.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>{t.booking}</span>
                </>
              ) : currentStep === 2 ? (
                <span>{t.confirmBooking}</span>
              ) : (
                <>
                  <span>{t.continue}</span>
                  <ArrowRight className="w-4 h-4" />
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
