import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-destructive text-destructive-foreground p-3 flex items-center justify-center gap-2 text-sm font-medium sticky top-0 z-40 shadow-md">
      <WifiOff size={18} />
      <span>Ste offline. Niektoré funkcie môžu byť obmedzené.</span>
    </div>
  );
};

export default OfflineBanner;
