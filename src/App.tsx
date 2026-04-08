import { Suspense, lazy, useState, useCallback, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import CookieBanner from "@/components/CookieBanner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/i18n/LanguageContext";
import SplashScreen from "@/components/SplashScreen";
import OfflineBanner from "@/components/OfflineBanner";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";
import ErrorBoundary from "@/components/ErrorBoundary";
import PushOptIn from "@/components/PushOptIn";
import { useServiceWorkerMessages } from "@/hooks/useServiceWorkerMessages";
import ClientLayout from "./components/layouts/ClientLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CancelBooking = lazy(() => import("./pages/CancelBooking"));
const Legal = lazy(() => import("./pages/Legal"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const Auth = lazy(() => import("./pages/Auth"));
const DesignShowcase = lazy(() => import("./pages/DesignShowcase"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const App = () => {
  useServiceWorkerMessages();
  const [isHydrated, setIsHydrated] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('fyzio_splash_shown');
  });

  useEffect(() => {
    console.log("[App] Component mounted, isHydrated set to true");
    setIsHydrated(true);
    // Clear query cache on mount ONLY during E2E tests to ensure fresh state
    // @ts-expect-error - playwright is injected by our fixtures
    if (window.playwright) {
      console.log("[App] Playwright detected, clearing query cache");
      queryClient.clear();
    }
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    sessionStorage.setItem('fyzio_splash_shown', 'true');
  }, []);

  return (
    <ErrorBoundary>
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <LanguageProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <div 
                  data-hydrated={isHydrated}
                  style={showSplash ? { opacity: 0, pointerEvents: 'none', position: 'absolute', width: '100%', height: '100%' } : { opacity: 1 }}>
                  <Toaster />
                  <Sonner position="top-center" />
                  {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
                  <BrowserRouter>
                    <OfflineBanner />
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                      <Routes>
                        {/* Client Routes with Layout */}
                        <Route element={<ClientLayout><Index /></ClientLayout>} path="/" />
                        <Route element={<Auth />} path="/auth" />
                        <Route 
                          element={
                            <ProtectedRoute>
                              <ClientLayout>
                                <ClientPortal />
                              </ClientLayout>
                            </ProtectedRoute>
                          } 
                          path="/portal" 
                        />
                        <Route element={<ClientLayout><CancelBooking /></ClientLayout>} path="/cancel" />
                        <Route element={<ClientLayout><Legal /></ClientLayout>} path="/legal" />
                        <Route element={<Navigate to="/auth" replace />} path="/client-auth" />

                        {/* Admin Routes (Disabled/Hidden) */}
                        <Route element={<NotFound />} path="/admin*" />
                        <Route element={<DesignShowcase />} path="/design-showcase" />

                        <Route element={<NotFound />} path="*" />
                      </Routes>
                    </Suspense>
                    <CookieBanner />
                    {!import.meta.env.DEV && <PWAUpdatePrompt />}
                    {!import.meta.env.DEV && <PushOptIn />}
                  </BrowserRouter>
                </div>
              </TooltipProvider>
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
          </ErrorBoundary>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
