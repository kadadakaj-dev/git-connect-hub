import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Listens for messages from the Service Worker (e.g., Background Sync completion).
 */
export function useServiceWorkerMessages() {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'BOOKING_SYNC_SUCCESS') {
        toast.success('Vaša rezervácia bola úspešne odoslaná.', {
          description: 'Pripojenie bolo obnovené a rezervácia spracovaná.',
          duration: 6000,
        });
      }
    };

    navigator.serviceWorker?.addEventListener('message', handler);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handler);
    };
  }, []);
}
