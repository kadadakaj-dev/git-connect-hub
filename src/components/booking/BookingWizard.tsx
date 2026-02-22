import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingData, BookingStep, Service } from '@/types/booking';
import ProgressBar from './ProgressBar';
import ServiceSelection from './ServiceSelection';
import DateTimeSelection from './DateTimeSelection';
import ClientDetails from './ClientDetails';
import Confirmation from './Confirmation';
import Footer from '../Footer';
import ThemeToggle from '../ThemeToggle';
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
    <div className="min-h-screen gradient-hero flex flex-col relative overflow-hidden bg-noise">
      {/* Atmospheric liquid gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Emerald blob - top right */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] animate-float-slow" />
        
        {/* Charcoal blob - left */}
        <div 
          className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] animate-float" 
          style={{ animationDelay: '1s' }} 
        />
        
        {/* Emerald accent - bottom */}
        <div 
          className="absolute bottom-20 right-1/4 w-[350px] h-[350px] bg-primary/6 rounded-full blur-[100px] animate-float-slow" 
          style={{ animationDelay: '2s' }} 
        />
        
        {/* Morphing shape */}
        <div 
          className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-br from-primary/5 to-transparent animate-morph blur-[80px]"
        />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 grid-pattern" />
      </div>

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-6 md:py-10 flex-1 relative z-10">
        {/* Header */}
        <header className="text-center mb-6 sm:mb-8 md:mb-10 animate-fade-in-up relative">
          {/* Top right controls */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm" 
              asChild 
              className="gap-2 group hover:bg-primary/10 transition-all duration-300"
            >
              <Link to="/auth">
                <div className="relative">
                  <User className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <span className="hidden sm:inline font-medium">
                  {language === 'sk' ? 'Klientský portál' : 'Client Portal'}
                </span>
              </Link>
            </Button>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full glass-card text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-5 transition-all duration-300 cursor-default animate-glow-pulse">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse-soft" />
            <span className="tracking-wider uppercase">{t.clinicSubtitle}</span>
          </div>
          
          {/* Main title - gradient text */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gradient mb-3 sm:mb-4">
            <span className="relative inline-block">
              {t.clinicName}
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full transform scale-x-0 animate-[scale-x_0.8s_0.3s_ease-out_forwards] origin-left" />
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {language === 'sk' 
              ? 'Profesionálna starostlivosť o vaše zdravie v príjemnom prostredí'
              : 'Professional healthcare in a comfortable environment'
            }
          </p>
          
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-4 sm:mt-5 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
              <span>{language === 'sk' ? 'Certifikovaný terapeut' : 'Certified Therapist'}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
              <span>{language === 'sk' ? '10+ rokov skúseností' : '10+ Years Experience'}</span>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        {currentStep < 3 && (
          <div className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <ProgressBar steps={steps.slice(0, 3)} currentStep={currentStep} />
          </div>
        )}

        {/* Step Content */}
        <main className={cn(
          "mt-4 sm:mt-6 transition-all duration-300",
          isTransitioning && "opacity-0 transform translate-y-2"
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
          <nav className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-border/30">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className={cn(
                "gap-2 order-2 sm:order-1 w-full sm:w-auto h-11 sm:h-10",
                "hover:bg-primary/10 active:scale-[0.97] transition-all duration-300",
                "group"
              )}
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
              {t.back}
            </Button>

            <Button
              variant="booking"
              size="lg"
              onClick={handleNext}
              disabled={!canProceed() || createBooking.isPending}
              className={cn(
                "gap-2.5 min-w-[160px] sm:min-w-[200px] order-1 sm:order-2 w-full sm:w-auto h-12 sm:h-12",
                "group relative overflow-hidden",
                "transition-all duration-300",
                canProceed() && !createBooking.isPending && "animate-pulse-soft hover:animate-none"
              )}
            >
              {/* Shimmer effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              {createBooking.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>{t.booking}</span>
                </>
              ) : currentStep === 2 ? (
                <>
                  <span className="font-semibold">{t.confirmBooking}</span>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </>
              ) : (
                <>
                  <span className="font-medium">{t.continue}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
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
