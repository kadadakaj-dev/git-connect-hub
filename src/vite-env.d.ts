/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:pwa-register/react' {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  import { Dispatch, SetStateAction } from 'react';
  export interface RegisterSWOptions {
    immediate?: boolean;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: any) => void;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
  }
  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
  /**
   * Custom mock state added for Vitest testing.
   */
  export const mockPWAState: {
    needRefresh: boolean;
    offlineReady: boolean;
    updateServiceWorker: any; // Using any for simplicity in d.ts, but it's a vi.fn()
  };
}
