// @ts-ignore - virtual module provided by vite-plugin-pwa at build time
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useCallback } from 'react';

const PWAUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check for updates every 60 minutes
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  const handleUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  const handleDismiss = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[200] mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl border border-border/50 bg-white/95 backdrop-blur-xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5 text-lg">🔄</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#24476B]">
              Nová verzia dostupná
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aktualizujte pre najlepší zážitok.
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
            onClick={handleUpdate}
            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-[#24476B] rounded-xl hover:bg-[#1e3a5a] transition-colors"
          >
            Aktualizovať
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
