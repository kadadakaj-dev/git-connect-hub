import { Suspense, lazy, useState, useCallback, Component, ReactNode } from "react";
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

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminResetPassword = lazy(() => import("./pages/AdminResetPassword"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CancelBooking = lazy(() => import("./pages/CancelBooking"));
const Legal = lazy(() => import("./pages/Legal"));
const ClientAuth = lazy(() => import("./pages/ClientAuth"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));

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
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('fyzio_splash_shown');
  });

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
                {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
                <div style={showSplash ? { opacity: 0, pointerEvents: 'none', position: 'absolute', width: '100%', height: '100%' } : { opacity: 1, transition: 'opacity 0.3s ease' }}>
                  <Toaster />
                  <Sonner position="top-center" />
                  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <OfflineBanner />
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                      <Routes>
                        {/* Client Routes with Layout */}
                        <Route element={<ClientLayout><Index /></ClientLayout>} path="/" />
                        <Route element={<ClientLayout><ClientAuth /></ClientLayout>} path="/auth" />
                        <Route element={<ClientLayout><ClientPortal /></ClientLayout>} path="/portal" />
                        <Route element={<ClientLayout><CancelBooking /></ClientLayout>} path="/cancel" />
                        <Route element={<ClientLayout><Legal /></ClientLayout>} path="/legal" />

                        {/* Admin Routes (No Layout) */}
                        <Route element={<AdminLogin />} path="/admin/login" />
                        <Route element={<AdminResetPassword />} path="/admin/reset-password" />
                        <Route element={<AdminDashboard />} path="/admin" />

                        <Route element={<NotFound />} path="*" />
                      </Routes>
                    </Suspense>
                    <CookieBanner />
                    {!import.meta.env.DEV && <PWAUpdatePrompt />}
                    {!import.meta.env.DEV && <PushOptIn />}
                  </BrowserRouter>
                </div>
              </TooltipProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
