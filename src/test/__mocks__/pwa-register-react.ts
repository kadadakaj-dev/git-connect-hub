import { useState, useEffect } from 'react';

// Exported for tests to control
export const mockPWAState = {
  needRefresh: false,
  offlineReady: false,
  updateServiceWorker: vi.fn(() => Promise.resolve()),
};

export function useRegisterSW(_options?: Record<string, unknown>) {
  const [needRefresh, setNeedRefresh] = useState(mockPWAState.needRefresh);
  const [offlineReady, setOfflineReady] = useState(mockPWAState.offlineReady);

  useEffect(() => {
    setNeedRefresh(mockPWAState.needRefresh);
    setOfflineReady(mockPWAState.offlineReady);
  }, []);

  return {
    needRefresh: [needRefresh, setNeedRefresh] as const,
    offlineReady: [offlineReady, setOfflineReady] as const,
    updateServiceWorker: mockPWAState.updateServiceWorker,
  };
}
