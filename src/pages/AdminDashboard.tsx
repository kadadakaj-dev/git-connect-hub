import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ServiceManagement from '@/components/admin/ServiceManagement';
import { toast } from 'sonner';
import { LogOut, Calendar, Package, BarChart3 } from 'lucide-react';
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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              {language === 'sk' ? 'Prehľad' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <Calendar className="w-4 h-4" />
              {language === 'sk' ? 'Rezervácie' : 'Bookings'}
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Package className="w-4 h-4" />
              {language === 'sk' ? 'Služby' : 'Services'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'sk' ? 'Rezervácie dnes' : "Today's Bookings"}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">--</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'sk' ? 'Tento týždeň' : 'This Week'}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">--</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'sk' ? 'Aktívne služby' : 'Active Services'}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                    <Package className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">4</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 border-border/50">
              <CardHeader>
                <CardTitle>
                  {language === 'sk' ? 'Posledné rezervácie' : 'Recent Bookings'}
                </CardTitle>
                <CardDescription>
                  {language === 'sk' 
                    ? 'Zatiaľ nie sú žiadne rezervácie' 
                    : 'No bookings yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  {language === 'sk' 
                    ? 'Rezervácie sa tu zobrazia po vytvorení' 
                    : 'Bookings will appear here once created'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>
                  {language === 'sk' ? 'Všetky rezervácie' : 'All Bookings'}
                </CardTitle>
                <CardDescription>
                  {language === 'sk' 
                    ? 'Správa rezervácií klientov' 
                    : 'Manage client bookings'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  {language === 'sk' 
                    ? 'Zatiaľ nie sú žiadne rezervácie' 
                    : 'No bookings yet'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
