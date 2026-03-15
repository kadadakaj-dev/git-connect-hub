import { useState, useRef } from 'react';
import { BookingData, Service } from '@/types/booking';
import ServiceSelection from './ServiceSelection';
import DateTimeSelection from './DateTimeSelection';
import Confirmation from './Confirmation';
import Footer from '../Footer';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCreateBooking } from '@/hooks/useCreateBooking';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import GlassBackground from '../GlassBackground';
import BookingHeader from './BookingHeader';
import ClientDetailsForm from './ClientDetailsForm';
import GlassCard from './GlassCard';
import SectionHeader from './SectionHeader';
import SubmitButton from './SubmitButton';

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
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmed, setIsConfirmed] = useState(false);
  const createBooking = useCreateBooking();

  const dateTimeRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const updateBookingData = <K extends keyof BookingData>(field: K, value: BookingData[K]) => {
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
    } else if (!/^[+]?[0-9\s\-()]{7,20}$/.test(bookingData.clientPhone.trim())) {
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

  if (isConfirmed) {
    return (
      <div className="min-h-screen relative flex flex-col">
        <GlassBackground />
        <BookingHeader />
        <div className="container max-w-2xl mx-auto px-4 py-6 flex-1 relative z-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <GlassCard>
              <Confirmation bookingData={bookingData} onNewBooking={handleNewBooking} />
            </GlassCard>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <GlassBackground />
      <BookingHeader />

      <div className="container max-w-2xl mx-auto px-4 py-5 flex-1 relative z-10">
        {/* Step 1: Service */}
        <section className="mb-4">
          <SectionHeader number={1} title={language === 'sk' ? 'Vyberte službu' : 'Select service'} completed={hasService} />
          <div className="mt-2">
            <GlassCard>
              <ServiceSelection selectedService={bookingData.service} onSelect={handleServiceSelect} />
            </GlassCard>
          </div>
        </section>

        {/* Step 2 & 3: Date & Time */}
        <motion.section
          ref={dateTimeRef}
          animate={{ opacity: hasService ? 1 : 0.3 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ opacity: 0.3 }}
          className={cn("mb-4 scroll-mt-36 sm:scroll-mt-28", !hasService && "pointer-events-none")}
        >
          <div className="flex items-center gap-6 mb-2">
            <SectionHeader number={2} title={language === 'sk' ? 'Vyberte dátum' : 'Select date'} completed={!!bookingData.date} />
            <SectionHeader number={3} title={language === 'sk' ? 'Vyberte čas' : 'Select time'} completed={!!bookingData.time} />
          </div>
          <div className="mt-2">
            <GlassCard>
              <DateTimeSelection
                selectedDate={bookingData.date}
                selectedTime={bookingData.time}
                onDateSelect={(date) => updateBookingData('date', date)}
                onTimeSelect={handleTimeSelect}
                serviceDuration={bookingData.service?.duration}
              />
            </GlassCard>
          </div>
        </motion.section>

        {/* Step 4: Client Details */}
        <motion.section
          ref={detailsRef}
          animate={{ opacity: hasDateTime ? 1 : 0.3 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ opacity: 0.3 }}
          className={cn("mb-4 scroll-mt-28 sm:scroll-mt-24", !hasDateTime && "pointer-events-none")}
        >
          <SectionHeader number={4} title={language === 'sk' ? 'Vyplňte Vaše údaje' : 'Your details'} completed={false} />
          <div className="mt-2">
            <GlassCard>
              <ClientDetailsForm bookingData={bookingData} errors={errors} onUpdate={updateBookingData} />
            </GlassCard>
          </div>
        </motion.section>

        {/* Submit */}
        <SubmitButton enabled={hasService && hasDateTime} isPending={createBooking.isPending} onSubmit={handleSubmit} />
      </div>

      <Footer />
    </div>
  );
};

export default BookingWizard;
