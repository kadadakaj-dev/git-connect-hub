import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingData, BookingStep, Service } from '@/types/booking';
import ProgressBar from './ProgressBar';
import ServiceSelection from './ServiceSelection';
import DateTimeSelection from './DateTimeSelection';
import ClientDetails from './ClientDetails';
import Confirmation from './Confirmation';
import { toast } from 'sonner';

const steps: BookingStep[] = [
  { id: 1, title: 'Service', description: 'Choose your treatment' },
  { id: 2, title: 'Date & Time', description: 'Pick your slot' },
  { id: 3, title: 'Details', description: 'Your information' },
  { id: 4, title: 'Confirm', description: 'Review & book' },
];

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
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateBookingData = (field: string, value: any) => {
    setBookingData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
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
          toast.error('Please select a service');
          return false;
        }
        break;
      case 1:
        if (!bookingData.date) {
          toast.error('Please select a date');
          return false;
        }
        if (!bookingData.time) {
          toast.error('Please select a time slot');
          return false;
        }
        break;
      case 2:
        if (!bookingData.clientName.trim()) {
          newErrors.clientName = 'Name is required';
        }
        if (!bookingData.clientEmail.trim()) {
          newErrors.clientEmail = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.clientEmail)) {
          newErrors.clientEmail = 'Please enter a valid email';
        }
        if (!bookingData.clientPhone.trim()) {
          newErrors.clientPhone = 'Phone number is required';
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
      // Submit booking
      setIsSubmitting(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitting(false);
      toast.success('Booking confirmed successfully!');
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
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
    <div className="min-h-screen gradient-hero">
      <div className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            PhysioWell Clinic
          </h1>
          <p className="text-muted-foreground">
            Book your appointment in just a few steps
          </p>
        </div>

        {/* Progress Bar - hide on confirmation */}
        {currentStep < 3 && (
          <ProgressBar steps={steps.slice(0, 3)} currentStep={currentStep} />
        )}

        {/* Step Content */}
        <div className="mt-8">
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
        </div>

        {/* Navigation Buttons - hide on confirmation */}
        {currentStep < 3 && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              variant="booking"
              size="lg"
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="gap-2 min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Booking...
                </>
              ) : currentStep === 2 ? (
                'Confirm Booking'
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWizard;
