import { useState, useEffect, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  isSubscribedToPush,
} from '@/lib/pushNotifications';

/**
 * Shows a non-aggressive push notification opt-in prompt.
 * Only appears after the user completes a booking (triggered via localStorage flag).
 * Dismissible and respects denied permission.
 */
const PushOptIn = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      // Don't show if push is not supported
      if (!isPushSupported()) return;

      // Don't show if permission already granted or denied
      const permission = getPushPermission();
      if (permission !== 'default') return;

      // Don't show if already subscribed
      if (await isSubscribedToPush()) return;

      // Don't show if user dismissed previously (session-scoped)
      if (sessionStorage.getItem('fyzio_push_dismissed')) return;

      // Only show after a completed booking
      if (!localStorage.getItem('fyzio_booking_completed')) return;

      setShow(true);
    };

    // Delay check to avoid showing on initial load
    const timer = setTimeout(checkEligibility, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = useCallback(async () => {
    const sub = await subscribeToPush();
    if (sub) {
      setShow(false);
      localStorage.removeItem('fyzio_booking_completed');
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setShow(false);
    sessionStorage.setItem('fyzio_push_dismissed', 'true');
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[190] mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl border border-border/50 bg-white/95 backdrop-blur-xl shadow-xl p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Zavrieť"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-[#EAF6FF] flex items-center justify-center">
            <Bell size={18} className="text-[#24476B]" />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-sm font-semibold text-[#24476B]">
              Pripomenutia rezervácií
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pošleme vám pripomienku pred termínom. Žiadny spam.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 text-xs font-medium text-muted-foreground rounded-xl border border-border/50 hover:bg-accent transition-colors"
          >
            Neskôr
          </button>
          <button
            onClick={handleSubscribe}
            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-[#24476B] rounded-xl hover:bg-[#1e3a5a] transition-colors"
          >
            Povoliť notifikácie
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushOptIn;
