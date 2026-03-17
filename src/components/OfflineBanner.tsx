import { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (wasOffline.current) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
      wasOffline.current = true;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <div className="bg-emerald-600 text-white p-3 flex items-center justify-center gap-2 text-sm font-medium sticky top-0 z-40 shadow-md animate-in slide-in-from-top duration-300">
        <Wifi size={18} />
        <span>Pripojenie obnovené</span>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className="bg-destructive text-destructive-foreground p-3 flex items-center justify-center gap-2 text-sm font-medium sticky top-0 z-40 shadow-md animate-in slide-in-from-top duration-300">
      <WifiOff size={18} className="animate-pulse" />
      <span>Ste offline. Niektoré funkcie môžu byť obmedzené.</span>
    </div>
  );
};

export default OfflineBanner;
