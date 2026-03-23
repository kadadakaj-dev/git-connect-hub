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
import PushOptIn from "@/components/PushOptIn";
import { useServiceWorkerMessages } from "@/hooks/useServiceWorkerMessages";

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('App error boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 text-center">
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">Nastala neočakávaná chyba</p>
            <p className="text-sm text-muted-foreground mb-4">An unexpected error occurred</p>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
              <div style={showSplash ? { opacity: 0, pointerEvents: 'none', position: 'absolute', width: '100%', height: '100%' } : { opacity: 1, transition: 'opacity 0.3s ease' }}>
                <Toaster />
                <Sonner position="top-center" />
                <BrowserRouter>
                  <OfflineBanner />
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<ClientAuth />} />
                      <Route path="/portal" element={<ClientPortal />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/admin/reset-password" element={<AdminResetPassword />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/cancel" element={<CancelBooking />} />
                      <Route path="/legal" element={<Legal />} />
                      
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <CookieBanner />
                  <PWAUpdatePrompt />
                  <PushOptIn />
                </BrowserRouter>
              </div>
            </TooltipProvider>
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
