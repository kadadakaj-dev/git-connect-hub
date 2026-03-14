import { useEffect, useState } from 'react';
import PageMeta from '@/components/seo/PageMeta';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { format } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import GlassBackground from '@/components/GlassBackground';
import GlassCard from '@/components/booking/GlassCard';

type CancelStatus = 'loading' | 'confirm' | 'success' | 'error' | 'already_cancelled';

interface BookingDetails {
  date: string;
  time_slot: string;
  client_name: string;
  service_name_sk?: string;
  service_name_en?: string;
}

const CancelBooking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const locale = language === 'sk' ? sk : enUS;
  
  const [status, setStatus] = useState<CancelStatus>('loading');
  const [error, setError] = useState<string>('');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const token = searchParams.get('token');

  const translations = {
    sk: {
      title: 'Zrušenie rezervácie',
      loading: 'Overujem rezerváciu...',
      confirmTitle: 'Chcete zrušiť túto rezerváciu?',
      confirmSubtitle: 'Táto akcia je nezvratná',
      cancelButton: 'Áno, zrušiť rezerváciu',
      keepButton: 'Nie, ponechať',
      successTitle: 'Rezervácia zrušená',
      successSubtitle: 'Vaša rezervácia bola úspešne zrušená',
      alreadyCancelledTitle: 'Rezervácia už bola zrušená',
      alreadyCancelledSubtitle: 'Táto rezervácia bola zrušená skôr',
      errorTitle: 'Chyba',
      invalidToken: 'Neplatný odkaz na zrušenie',
      notFound: 'Rezervácia nebola nájdená',
      pastBooking: 'Nemožno zrušiť minulé rezervácie',
      backToHome: 'Späť na hlavnú stránku',
      newBooking: 'Nová rezervácia',
      service: 'Služba',
      dateTime: 'Dátum a čas',
      client: 'Klient',
    },
    en: {
      title: 'Cancel Booking',
      loading: 'Verifying booking...',
      confirmTitle: 'Do you want to cancel this booking?',
      confirmSubtitle: 'This action cannot be undone',
      cancelButton: 'Yes, cancel booking',
      keepButton: 'No, keep it',
      successTitle: 'Booking Cancelled',
      successSubtitle: 'Your booking has been successfully cancelled',
      alreadyCancelledTitle: 'Booking Already Cancelled',
      alreadyCancelledSubtitle: 'This booking was cancelled earlier',
      errorTitle: 'Error',
      invalidToken: 'Invalid cancellation link',
      notFound: 'Booking not found',
      pastBooking: 'Cannot cancel past bookings',
      backToHome: 'Back to Home',
      newBooking: 'New Booking',
      service: 'Service',
      dateTime: 'Date & Time',
      client: 'Client',
    },
  };

  const text = translations[language];

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError(text.invalidToken);
      return;
    }
    verifyBooking();
  }, [token, text.invalidToken]);

  const verifyBooking = async () => {
    try {
      const response = await supabase.functions.invoke('get-booking-by-token', {
        body: { token },
      });
      if (response.error) throw new Error(response.error.message);
      const data = response.data;
      if (!data.success) {
        if (data.error === 'Booking is already cancelled') {
          setBooking(data.booking);
          setStatus('already_cancelled');
        } else {
          setError(data.error || text.notFound);
          setStatus('error');
        }
        return;
      }
      setBooking(data.booking);
      setStatus('confirm');
    } catch (err) {
      console.error('Error verifying booking:', err);
      setError(text.notFound);
      setStatus('error');
    }
  };

  const handleCancel = async () => {
    if (!token) return;
    setIsProcessing(true);
    try {
      const response = await supabase.functions.invoke('cancel-booking', {
        body: { token },
      });
      if (response.error) throw new Error(response.error.message);
      const data = response.data;
      if (!data.success) {
        if (data.error === 'Booking is already cancelled') {
          setStatus('already_cancelled');
        } else {
          setError(data.error);
          setStatus('error');
        }
        return;
      }
      setBooking(data.booking);
      setStatus('success');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(language === 'sk' ? 'Nepodarilo sa zrušiť rezerváciu' : 'Failed to cancel booking');
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderBookingDetails = () => {
    if (!booking) return null;
    const serviceName = language === 'sk' ? booking.service_name_sk : booking.service_name_en;
    const formattedDate = booking.date
      ? format(new Date(booking.date), 'EEEE, d. MMMM yyyy', { locale })
      : '';

    return (
      <GlassCard className="rounded-xl p-6 text-left space-y-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{text.dateTime}</p>
            <p className="font-medium text-foreground">{formattedDate}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {booking.time_slot}
            </p>
          </div>
        </div>
        {serviceName && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{text.service}</p>
              <p className="font-medium text-foreground">{serviceName}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{text.client}</p>
            <p className="font-medium text-foreground">{booking.client_name}</p>
          </div>
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <GlassBackground />
      <PageMeta
        titleSk="Zrušenie rezervácie | FYZIO&FIT"
        titleEn="Cancel Booking | FYZIO&FIT"
        descriptionSk="Zrušte svoju rezerváciu online."
        descriptionEn="Cancel your booking online."
        path="/cancel"
        noindex
      />
      <div className="container max-w-2xl mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-2">
            {t.clinicName}
          </h1>
          <p className="text-muted-foreground mb-8">{text.title}</p>

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">{text.loading}</p>
            </div>
          )}

          {status === 'confirm' && (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-12 h-12 text-warning" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{text.confirmTitle}</h2>
                <p className="text-muted-foreground">{text.confirmSubtitle}</p>
              </div>
              {renderBookingDetails()}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <Button variant="destructive" size="lg" onClick={handleCancel} disabled={isProcessing} className="min-w-[180px]">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {language === 'sk' ? 'Ruším...' : 'Cancelling...'}
                    </>
                  ) : text.cancelButton}
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/')} className="min-w-[180px]">
                  {text.keepButton}
                </Button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{text.successTitle}</h2>
                <p className="text-muted-foreground">{text.successSubtitle}</p>
              </div>
              {renderBookingDetails()}
              <Button variant="booking" size="lg" onClick={() => navigate('/')} className="mt-6">
                {text.newBooking}
              </Button>
            </div>
          )}

          {status === 'already_cancelled' && (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{text.alreadyCancelledTitle}</h2>
                <p className="text-muted-foreground">{text.alreadyCancelledSubtitle}</p>
              </div>
              {renderBookingDetails()}
              <Button variant="booking" size="lg" onClick={() => navigate('/')} className="mt-6">
                {text.newBooking}
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{text.errorTitle}</h2>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button variant="subtle" size="lg" onClick={() => navigate('/')} className="mt-6">
                {text.backToHome}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelBooking;
