import { useEffect, useRef, useState } from 'react';
import { generateId } from '@/lib/uuid';
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
import { mapBookingErrorMessage } from './bookingErrorMessages';
import { useServices } from '@/hooks/useServices';

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
  const [bookingId, setBookingId] = useState<string | undefined>();
  const [clientRequestId, setClientRequestId] = useState(() => generateId());
  const createBooking = useCreateBooking();
  const { data: services } = useServices();

  const dateTimeRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLDivElement>(null);
  const lastTimeSelectRef = useRef<number>(0);
  const consumedServiceParamRef = useRef(false);

  useEffect(() => {
    if (consumedServiceParamRef.current || !services) return;
    consumedServiceParamRef.current = true;

    const searchParams = new URLSearchParams(window.location.search);
    const serviceFromQuery = searchParams.get('service');
    if (!serviceFromQuery) return;

    const matchedService = services.find((service) => service.id === serviceFromQuery);

    if (matchedService) {
      setBookingData((prev) => ({
        ...prev,
        service: matchedService,
        date: null,
        time: null,
      }));

      setTimeout(() => {
        dateTimeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } else {
      toast.error(language === 'sk' ? 'Vybraná služba nie je dostupná' : 'Selected service is not available');
    }

    searchParams.delete('service');
    const newSearch = searchParams.toString();
    const nextUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [language, services]);

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
    const now = Date.now();
    if (now - lastTimeSelectRef.current < 400) return; // ignore ghost taps
    lastTimeSelectRef.current = now;

    updateBookingData('time', time);
    setTimeout(() => {
      if (submitRef.current) {
        submitRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
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
      newErrors.clientPhone = language === 'sk' ? 'Neplatné telefónne číslo' : 'Invalid phone number';
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
      const result = await createBooking.mutateAsync({
        serviceId: bookingData.service.id,
        date: bookingData.date,
        timeSlot: bookingData.time,
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        clientPhone: bookingData.clientPhone,
        notes: bookingData.notes || undefined,
        clientRequestId: clientRequestId,
      });
      if (result.queued) {
        toast.info(
          language === 'sk'
            ? 'Ste offline. Rezervácia bude odoslaná automaticky po obnovení pripojenia.'
            : 'You are offline. Your booking will be sent automatically when you reconnect.'
        );
      } else {
        toast.success(t.bookingSuccess);
      }
      setBookingId(result.booking?.id);
      setIsConfirmed(true);
      localStorage.setItem('fyzio_booking_completed', 'true');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Booking failed';
      toast.error(mapBookingErrorMessage(message, t.bookingErrors));
    }
  };

  const handleNewBooking = () => {
    setBookingData(initialBookingData);
    setErrors({});
    setIsConfirmed(false);
    setBookingId(undefined);
    setClientRequestId(generateId());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasService = !!bookingData.service;
  const hasDateTime = !!bookingData.date && !!bookingData.time;

  if (isConfirmed) {
    return (
      <div className="min-h-app-screen relative flex flex-col">
        <GlassBackground />
        <BookingHeader />
        <div className="container max-w-2xl mx-auto px-4 py-3 sm:py-6 flex-1 relative z-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <GlassCard>
              <Confirmation bookingData={bookingData} onNewBooking={handleNewBooking} bookingId={bookingId} />
            </GlassCard>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-app-screen relative flex flex-col">
      <GlassBackground />
      <BookingHeader />

      <div className="container max-w-2xl mx-auto px-4 py-3 sm:py-5 flex-1 relative z-10">
        {/* Step 1: Service */}
        <motion.section
          className="mb-3 sm:mb-4"
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionHeader number={1} title={language === 'sk' ? 'Vyberte službu' : 'Select service'} completed={hasService} />
          <div className="mt-2">
            <GlassCard>
              <ServiceSelection selectedService={bookingData.service} onSelect={handleServiceSelect} />
            </GlassCard>
          </div>
        </motion.section>

        {/* Step 2 & 3: Date & Time */}
        <motion.section
          ref={dateTimeRef}
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: hasService ? 1 : 0.35, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className={cn("mb-3 sm:mb-4 scroll-mt-20 sm:scroll-mt-28", !hasService && "pointer-events-none")}
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
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: hasDateTime ? 1 : 0.35, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className={cn("mb-3 sm:mb-4 scroll-mt-20 sm:scroll-mt-24", !hasDateTime && "pointer-events-none")}
        >
          <SectionHeader number={4} title={language === 'sk' ? 'Vyplňte Vaše údaje' : 'Your details'} completed={false} />
          <div className="mt-2">
            <GlassCard>
              <ClientDetailsForm bookingData={bookingData} errors={errors} onUpdate={updateBookingData} />
            </GlassCard>
          </div>
        </motion.section>

        {/* Submit */}
        <motion.div
          ref={submitRef}
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
        >
          <SubmitButton enabled={hasService && hasDateTime} isPending={createBooking.isPending} onSubmit={handleSubmit} />
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingWizard;
