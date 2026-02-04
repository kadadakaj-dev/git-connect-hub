import { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
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
  const { t } = useLanguage();
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
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-accent/30 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 flex-1 relative z-10">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>{t.clinicSubtitle}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 tracking-tight">
            {t.clinicName}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
            Profesionálna starostlivosť o vaše zdravie
          </p>
        </header>

        {/* Progress Bar */}
        {currentStep < 3 && (
          <div className="mb-8">
            <ProgressBar steps={steps.slice(0, 3)} currentStep={currentStep} />
          </div>
        )}

        {/* Step Content */}
        <main className="mt-6 sm:mt-8">
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
          <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 sm:mt-12 pt-6 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2 order-2 sm:order-1 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Button>

            <Button
              variant="booking"
              size="lg"
              onClick={handleNext}
              disabled={!canProceed() || createBooking.isPending}
              className="gap-2 min-w-[180px] order-1 sm:order-2 w-full sm:w-auto"
            >
              {createBooking.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-navy-foreground border-t-transparent rounded-full animate-spin" />
                  {t.booking}
                </>
              ) : currentStep === 2 ? (
                t.confirmBooking
              ) : (
                <>
                  {t.continue}
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
