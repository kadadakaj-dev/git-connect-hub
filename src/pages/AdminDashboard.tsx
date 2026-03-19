import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import { LogOut, Calendar, Package, BarChart3, CalendarDays, Users, Clock, Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import GlassBackground from '@/components/GlassBackground';

const ServiceManagement = lazy(() => import('@/components/admin/ServiceManagement'));
const BookingManagement = lazy(() => import('@/components/admin/BookingManagement'));
const OverviewStats = lazy(() => import('@/components/admin/OverviewStats'));
const CalendarView = lazy(() => import('@/components/admin/CalendarView'));
const EmployeeManagement = lazy(() => import('@/components/admin/EmployeeManagement'));
const OpeningHoursManagement = lazy(() => import('@/components/admin/OpeningHoursManagement'));

const AdminDashboard = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/admin/login');
        return;
      }

      // Check admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roleData) {
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      setUser(session.user);
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(language === 'sk' ? 'Odhlásený' : 'Logged out');
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-app-screen relative">
      <GlassBackground />
      {/* Header */}
      <header className="border-b border-[var(--glass-border-subtle)] backdrop-blur-2xl bg-[var(--glass-white-md)] sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-heading font-semibold text-foreground">
              {language === 'sk' ? 'Admin Panel' : 'Admin Panel'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'sk' ? 'Odhlásiť' : 'Logout'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
        <div className="mb-3 sm:mb-8">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
            {language === 'sk' ? 'Vitajte späť!' : 'Welcome back!'}
          </h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {language === 'sk'
              ? 'Tu je prehľad vášho booking systému'
              : 'Here is an overview of your booking system'}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-3 sm:space-y-6">
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start gap-0.5 sm:gap-1 rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/60 p-1 shadow-[0_4px_12px_rgba(126,195,255,0.06)]">
            <TabsTrigger value="overview" className="gap-1.5 sm:gap-2 rounded-[14px] px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white/88 data-[state=active]:shadow-[0_8px_20px_rgba(126,195,255,0.12)]">
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{language === 'sk' ? 'Prehľad' : 'Overview'}</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5 sm:gap-2 rounded-[14px] px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white/88 data-[state=active]:shadow-[0_8px_20px_rgba(126,195,255,0.12)]">
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{language === 'sk' ? 'Kalendár' : 'Calendar'}</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5 sm:gap-2 rounded-[14px] px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white/88 data-[state=active]:shadow-[0_8px_20px_rgba(126,195,255,0.12)]">
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{language === 'sk' ? 'Rezervácie' : 'Bookings'}</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1.5 sm:gap-2 rounded-[14px] px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white/88 data-[state=active]:shadow-[0_8px_20px_rgba(126,195,255,0.12)]">
              <Package className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{language === 'sk' ? 'Služby' : 'Services'}</span>
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-1.5 sm:gap-2 rounded-[14px] px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white/88 data-[state=active]:shadow-[0_8px_20px_rgba(126,195,255,0.12)]">
              <Users className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{language === 'sk' ? 'Zamestnanci' : 'Employees'}</span>
            </TabsTrigger>
            <TabsTrigger value="hours" className="gap-1.5 sm:gap-2 rounded-[14px] px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white/88 data-[state=active]:shadow-[0_8px_20px_rgba(126,195,255,0.12)]">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{language === 'sk' ? 'Hodiny' : 'Hours'}</span>
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <TabsContent value="overview">
              <OverviewStats />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarView />
            </TabsContent>

            <TabsContent value="bookings">
              <BookingManagement />
            </TabsContent>

            <TabsContent value="services">
              <ServiceManagement />
            </TabsContent>

            <TabsContent value="employees">
              <EmployeeManagement />
            </TabsContent>

            <TabsContent value="hours">
              <OpeningHoursManagement />
            </TabsContent>
          </Suspense>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
