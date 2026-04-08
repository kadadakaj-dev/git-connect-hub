import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Suspense, lazy } from 'react';
import { toast } from 'sonner';
import { LogOut, Calendar, Package, BarChart3, CalendarDays, Users, Clock } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import GlassBackground from '@/components/GlassBackground';

// Lazy load admin sub-components to reduce initial bundle size
const ServiceManagement = lazy(() => import('@/components/admin/ServiceManagement'));
const BookingManagement = lazy(() => import('@/components/admin/BookingManagement'));
const OverviewStats = lazy(() => import('@/components/admin/OverviewStats'));
const CalendarView = lazy(() => import('@/components/admin/CalendarView'));
const EmployeeManagement = lazy(() => import('@/components/admin/EmployeeManagement'));
const OpeningHoursManagement = lazy(() => import('@/components/admin/OpeningHoursManagement'));

// Loading component for Suspense
const TabLoading = () => (
  <div className="flex flex-col items-center justify-center py-24 sm:py-32 gap-6 animate-in fade-in duration-500">
    <div className="relative group">
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all duration-500 animate-pulse" />
      <div className="relative w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin-slow shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
    </div>
    <div className="flex flex-col items-center gap-1">
      <p className="text-sm text-foreground font-semibold tracking-wide">Pripravujeme prostredie</p>
      <p className="text-[11px] text-muted-foreground font-medium animate-pulse">Momentík, načítavame modul...</p>
    </div>
  </div>
);

const Admin = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError || !session) {
          navigate('/auth', { replace: true });
          return;
        }

        // STRICT SINGLE ADMIN ACCESS MODEL
        const isAdminEmail = session.user.email === 'booking@fyzioafit.sk';
        
        // Secondary check via DB roles if the developer changes the email later
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!isAdminEmail && (!roleData || roleData.role !== 'admin')) {
          console.warn('[Admin] Unauthorized access attempt by:', session.user.email);
          toast.error(language === 'sk' ? 'Nemáte administrátorské oprávnenie' : 'Unauthorized access');
          navigate('/portal', { replace: true });
          return;
        }

        setUser(session.user);
      } catch (err) {
        console.error('[Admin] Auth check failed:', err);
        navigate('/auth', { replace: true });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        navigate('/auth', { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, language]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(language === 'sk' ? 'Úspešne odhlásený' : 'Successfully logged out');
      navigate('/auth', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <GlassBackground />
        <div className="flex flex-col items-center gap-4 z-10 w-full max-w-sm px-6">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-lg" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            {language === 'sk' ? 'Overovanie prístupu...' : 'Verifying access...'}
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { value: 'overview', icon: BarChart3, label: language === 'sk' ? 'Prehľad' : 'Overview', shortLabel: language === 'sk' ? 'Prehl.' : 'Stats' },
    { value: 'calendar', icon: CalendarDays, label: language === 'sk' ? 'Kalendár' : 'Calendar', shortLabel: language === 'sk' ? 'Kal.' : 'Cal.' },
    { value: 'bookings', icon: Calendar, label: language === 'sk' ? 'Rezervácie' : 'Bookings', shortLabel: language === 'sk' ? 'Rez.' : 'Book.' },
    { value: 'services', icon: Package, label: language === 'sk' ? 'Služby' : 'Services', shortLabel: language === 'sk' ? 'Služ.' : 'Svc.' },
    { value: 'employees', icon: Users, label: language === 'sk' ? 'Zamestnanci' : 'Employees', shortLabel: language === 'sk' ? 'Zam.' : 'Emp.' },
    { value: 'hours', icon: Clock, label: language === 'sk' ? 'Hodiny' : 'Hours', shortLabel: language === 'sk' ? 'Hod.' : 'Hrs.' },
  ];

  return (
    <div className="min-h-app-screen relative">
      <GlassBackground />
      <header className="border-b border-[var(--glass-border-subtle)] backdrop-blur-2xl bg-[var(--glass-white-md)] sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-heading font-semibold text-foreground">
              {language === 'sk' ? 'Admin Panel' : 'Admin Panel'}
            </h1>
            <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 sm:h-9">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'sk' ? 'Odhlásiť' : 'Logout'}</span>
            </Button>
          </div>
        </div>
      </header>

      <main data-testid="admin-dashboard" className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative z-10">
        <div className="mb-4 sm:mb-8 hidden sm:block">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
            {language === 'sk' ? 'Vitajte v administrácii' : 'Welcome to administration'}
          </h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {language === 'sk'
              ? 'Máte najvyššiu úroveň oprávnení v systéme.'
              : 'You have full access to the scheduling system.'}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full grid grid-cols-6 gap-0 rounded-[14px] sm:rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/60 p-0.5 sm:p-1 shadow-[0_4px_12px_rgba(126,195,255,0.06)]">
            {tabs.map(({ value, icon: Icon, label, shortLabel }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 rounded-[12px] sm:rounded-[14px] px-1 sm:px-3.5 py-2 sm:py-2 text-[10px] sm:text-sm font-medium data-[state=active]:bg-white/88 data-[state=active]:shadow-[0_8px_20px_rgba(126,195,255,0.12)] min-w-0"
              >
                <Icon className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
                <span className="sm:hidden text-[9px] leading-tight">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <Suspense fallback={<TabLoading />}>
            <TabsContent value="overview"><OverviewStats /></TabsContent>
            <TabsContent value="calendar"><CalendarView /></TabsContent>
            <TabsContent value="bookings"><BookingManagement /></TabsContent>
            <TabsContent value="services"><ServiceManagement /></TabsContent>
            <TabsContent value="employees"><EmployeeManagement /></TabsContent>
            <TabsContent value="hours"><OpeningHoursManagement /></TabsContent>
          </Suspense>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
