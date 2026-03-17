import { useState } from 'react';

export function useRegisterSW(_options?: Record<string, unknown>) {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  return {
    needRefresh: [needRefresh, setNeedRefresh] as const,
    offlineReady: [offlineReady, setOfflineReady] as const,
    updateServiceWorker: (_reloadPage?: boolean) => Promise.resolve(),
  };
}
