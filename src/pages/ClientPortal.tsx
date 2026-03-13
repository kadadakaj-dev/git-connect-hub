import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { format, isPast, parseISO } from 'date-fns';
import { sk, enUS } from 'date-fns/locale';
import {
  Calendar,
  Camera,
  Clock,
  History,
  Heart,
  Plus,
  Star,
  User as UserIcon,
  FileText,
  Settings,
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ProfileEditDialog from '@/components/client/ProfileEditDialog';
import AvatarEditDialog from '@/components/client/AvatarEditDialog';
import SettingsMenu from '@/components/client/SettingsMenu';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useClientBookings } from '@/hooks/useClientBookings';
import { useFavoriteServices } from '@/hooks/useFavoriteServices';
import { useQueryClient } from '@tanstack/react-query';
import GlassBackground from '@/components/GlassBackground';

const ClientPortal = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate('/auth');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: profile, isLoading: profileLoading } = useClientProfile(user?.id);
  const { data: bookings, isLoading: bookingsLoading } = useClientBookings(user?.id);
  const { data: favorites, isLoading: favoritesLoading, toggleFavorite } = useFavoriteServices(profile?.id);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleProfileUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['client-profile', user?.id] });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const t = {
    sk: {
      title: 'Dashboard',
      welcome: 'Vitajte späť',
      totalVisits: 'Celkom návštev',
      upcomingAppointments: 'Nadchádzajúce termíny',
      pastAppointments: 'História návštev',
      favorites: 'Obľúbené služby',
      profile: 'Profil',
      noUpcoming: 'Žiadne nadchádzajúce termíny',
      noPast: 'Žiadna história návštev',
      noFavorites: 'Zatiaľ žiadne obľúbené služby',
      bookNow: 'Rezervovať teraz',
      quickBook: 'Rýchla rezervácia',
      signOut: 'Odhlásiť sa',
      editProfile: 'Upraviť profil',
      status: {
        pending: 'Čaká na potvrdenie',
        confirmed: 'Potvrdené',
        completed: 'Dokončené',
        cancelled: 'Zrušené',
      },
      therapistNotes: 'Poznámky terapeuta',
    },
    en: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      totalVisits: 'Total visits',
      upcomingAppointments: 'Upcoming Appointments',
      pastAppointments: 'Visit History',
      favorites: 'Favorite Services',
      profile: 'Profile',
      noUpcoming: 'No upcoming appointments',
      noPast: 'No visit history',
      noFavorites: 'No favorite services yet',
      bookNow: 'Book Now',
      quickBook: 'Quick Book',
      signOut: 'Sign Out',
      editProfile: 'Edit Profile',
      status: {
        pending: 'Pending',
        confirmed: 'Confirmed',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      therapistNotes: 'Therapist Notes',
    },
  };

  const text = t[language];
  const dateLocale = language === 'sk' ? sk : enUS;

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen relative p-4 md:p-8">
        <GlassBackground />
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings?.filter(
    (b) => !isPast(parseISO(`${b.date}T${b.time_slot}`)) && b.status !== 'cancelled'
  ) || [];

  const pastBookings = bookings?.filter(
    (b) => isPast(parseISO(`${b.date}T${b.time_slot}`)) || b.status === 'completed'
  ) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {text.status[status as keyof typeof text.status] || status}
      </Badge>
    );
  };

  return (
    <>
      <Helmet>
        <title>{text.title} | FYZIO&FIT</title>
      </Helmet>
      <div className="min-h-screen relative">
        <GlassBackground />
        {/* Header */}
        <header className="border-b border-[var(--glass-border-subtle)] backdrop-blur-2xl bg-[var(--glass-white-md)] sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAvatarDialogOpen(true)}
                className="relative group"
              >
                <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile?.full_name ? getInitials(profile.full_name) : <UserIcon className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </button>
              <div>
                <h1 className="text-xl font-bold">{text.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {text.welcome}, {profile?.full_name || user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageSwitcher />
              <SettingsMenu
                onEditProfile={() => setIsProfileDialogOpen(true)}
                onSignOut={handleSignOut}
                emailNotifications={profile?.email_notifications ?? true}
                userId={user?.id || ''}
                userEmail={user?.email || ''}
              />
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{text.totalVisits}</p>
                    <p className="text-3xl font-bold">{profile?.total_visits || 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{text.upcomingAppointments}</p>
                    <p className="text-3xl font-bold">{upcomingBookings.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{text.bookNow}</p>
                    <p className="text-lg font-medium text-primary">{text.quickBook}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                    <Plus className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">{text.upcomingAppointments}</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">{text.pastAppointments}</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">{text.favorites}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <Card>
                <CardHeader>
                  <CardTitle>{text.upcomingAppointments}</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-24" />
                      ))}
                    </div>
                  ) : upcomingBookings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{text.noUpcoming}</p>
                      <Button className="mt-4" onClick={() => navigate('/')}>
                        {text.bookNow}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{booking.service?.name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(parseISO(booking.date), 'PPP', { locale: dateLocale })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {booking.time_slot}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>{text.pastAppointments}</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24" />
                      ))}
                    </div>
                  ) : pastBookings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{text.noPast}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{booking.service?.name}</p>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(parseISO(booking.date), 'PPP', { locale: dateLocale })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {booking.time_slot}
                            </span>
                          </div>
                          {booking.therapist_notes && booking.therapist_notes.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm font-medium flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4" />
                                {text.therapistNotes}
                              </p>
                              {booking.therapist_notes.map((note) => (
                                <p key={note.id} className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                  {note.note}
                                </p>
                              ))}
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              if (booking.service) {
                                toggleFavorite(booking.service.id);
                              }
                            }}
                          >
                            <Heart
                              className={`h-4 w-4 mr-2 ${
                                favorites?.some((f) => f.service_id === booking.service?.id)
                                  ? 'fill-current text-destructive'
                                  : ''
                              }`}
                            />
                            {language === 'sk' ? 'Pridať medzi obľúbené' : 'Add to favorites'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle>{text.favorites}</CardTitle>
                  <CardDescription>
                    {language === 'sk'
                      ? 'Vaše obľúbené služby pre rýchlu rezerváciu'
                      : 'Your favorite services for quick booking'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {favoritesLoading ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : !favorites || favorites.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{text.noFavorites}</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {favorites.map((fav) => (
                        <div
                          key={fav.id}
                          className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{fav.service?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {fav.service?.duration} min • €{fav.service?.price}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFavorite(fav.service_id)}
                            >
                              <Heart className="h-4 w-4 fill-current text-destructive" />
                            </Button>
                          </div>
                          <Button
                            className="w-full mt-4"
                            size="sm"
                            onClick={() => navigate(`/?service=${fav.service_id}`)}
                          >
                            {text.quickBook}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Profile Edit Dialog */}
      {profile && (
        <ProfileEditDialog
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
          profile={profile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {/* Avatar Edit Dialog */}
      {profile && user && (
        <AvatarEditDialog
          open={isAvatarDialogOpen}
          onOpenChange={setIsAvatarDialogOpen}
          currentAvatarUrl={profile.avatar_url}
          fullName={profile.full_name}
          userId={user.id}
          onAvatarUpdated={handleProfileUpdated}
        />
      )}
    </>
  );
};

export default ClientPortal;
