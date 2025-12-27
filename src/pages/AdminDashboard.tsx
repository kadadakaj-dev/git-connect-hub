import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import { LogOut, Calendar, Users, Settings, BarChart3 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

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
        .single();

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

  const dashboardCards = [
    {
      title: language === 'sk' ? 'Rezervácie' : 'Bookings',
      description: language === 'sk' ? 'Spravovať rezervácie klientov' : 'Manage client bookings',
      icon: Calendar,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      title: language === 'sk' ? 'Klienti' : 'Clients',
      description: language === 'sk' ? 'Prehľad klientov' : 'Client overview',
      icon: Users,
      color: 'bg-green-500/10 text-green-500',
    },
    {
      title: language === 'sk' ? 'Štatistiky' : 'Statistics',
      description: language === 'sk' ? 'Prehľad výkonnosti' : 'Performance overview',
      icon: BarChart3,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      title: language === 'sk' ? 'Nastavenia' : 'Settings',
      description: language === 'sk' ? 'Konfigurácia systému' : 'System configuration',
      icon: Settings,
      color: 'bg-orange-500/10 text-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {language === 'sk' ? 'Admin Panel' : 'Admin Panel'}
            </h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {language === 'sk' ? 'Odhlásiť' : 'Logout'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {language === 'sk' ? 'Vitajte späť!' : 'Welcome back!'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'sk' 
              ? 'Tu je prehľad vášho booking systému' 
              : 'Here is an overview of your booking system'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardCards.map((card, index) => (
            <Card 
              key={index} 
              className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
                <p className="text-2xl font-bold mt-2">--</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-border/50">
          <CardHeader>
            <CardTitle>
              {language === 'sk' ? 'Posledné rezervácie' : 'Recent Bookings'}
            </CardTitle>
            <CardDescription>
              {language === 'sk' 
                ? 'Zatiaľ nie sú žiadne rezervácie v databáze' 
                : 'No bookings in database yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              {language === 'sk' 
                ? 'Rezervácie sa zobrazia po dokončení integrácie s databázou' 
                : 'Bookings will appear after database integration is complete'}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;