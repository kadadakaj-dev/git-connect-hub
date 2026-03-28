import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ServiceManagement from '@/components/admin/ServiceManagement';
import BookingManagement from '@/components/admin/BookingManagement';
import OverviewStats from '@/components/admin/OverviewStats';
import CalendarView from '@/components/admin/CalendarView';
import EmployeeManagement from '@/components/admin/EmployeeManagement';
import OpeningHoursManagement from '@/components/admin/OpeningHoursManagement';
import { toast } from 'sonner';
import { LogOut, Calendar, Package, BarChart3, CalendarDays, Users, Clock } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import GlassBackground from '@/components/GlassBackground';

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

      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-8 relative z-10">
        <div className="mb-2 sm:mb-8 hidden sm:block">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
            {language === 'sk' ? 'Vitajte späť!' : 'Welcome back!'}
          </h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {language === 'sk'
              ? 'Tu je prehľad vášho booking systému'
              : 'Here is an overview of your booking system'}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-2.5 sm:space-y-6">
          <TabsList className="w-full grid grid-cols-6 gap-0 rounded-[14px] sm:rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/60 p-0.5 sm:p-1 shadow-[0_4px_12px_rgba(126,195,255,0.06)]">
            {tabs.map(({ value, icon: Icon, label, shortLabel }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 rounded-[12px] sm:rounded-[14px] px-1 sm:px-3.5 pt-2 pb-2.5 sm:py-2 text-[10px] sm:text-sm font-medium data-[state=active]:bg-white/88 data-[state=active]:shadow-[0_8px_20px_rgba(126,195,255,0.12)] min-w-0"
              >
                <Icon className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
                <span className="sm:hidden text-[9px] leading-tight">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewStats /></TabsContent>
          <TabsContent value="calendar"><CalendarView /></TabsContent>
          <TabsContent value="bookings"><BookingManagement /></TabsContent>
          <TabsContent value="services"><ServiceManagement /></TabsContent>
          <TabsContent value="employees"><EmployeeManagement /></TabsContent>
          <TabsContent value="hours"><OpeningHoursManagement /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
