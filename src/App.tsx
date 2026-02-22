 import { Suspense, lazy } from "react";
 import { Toaster } from "@/components/ui/toaster";
import CookieBanner from "@/components/CookieBanner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/i18n/LanguageContext";
 // Lazy load pages for code splitting
 const Index = lazy(() => import("./pages/Index"));
 const NotFound = lazy(() => import("./pages/NotFound"));
 const AdminLogin = lazy(() => import("./pages/AdminLogin"));
 const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
 const CancelBooking = lazy(() => import("./pages/CancelBooking"));
 const Legal = lazy(() => import("./pages/Legal"));
 const ClientAuth = lazy(() => import("./pages/ClientAuth"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const Preview = lazy(() => import("./pages/Preview"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" />
            <BrowserRouter>
               <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                 <Routes>
                   <Route path="/" element={<Index />} />
                   <Route path="/auth" element={<ClientAuth />} />
                   <Route path="/portal" element={<ClientPortal />} />
                   <Route path="/admin/login" element={<AdminLogin />} />
                   <Route path="/admin" element={<AdminDashboard />} />
                   <Route path="/cancel" element={<CancelBooking />} />
                    <Route path="/legal" element={<Legal />} />
                    <Route path="/preview" element={<Preview />} />
                   {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                   <Route path="*" element={<NotFound />} />
                 </Routes>
               </Suspense>
            <CookieBanner />
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
