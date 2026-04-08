import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PageMeta from '@/components/seo/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  ShieldCheck,
  LogOut,
  Loader2,
  Edit2,
  Trash2,
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useClientProfile, useUpdateClientProfile } from '@/hooks/useClientProfile';
import { useClientBookings, useCancelBooking } from '@/hooks/useClientBookings';
import { useFavoriteServices } from '@/hooks/useFavoriteServices';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import GlassBackground from '@/components/GlassBackground';
import { cn } from '@/lib/utils';

const ClientPortal = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  
  // New States
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "" });

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error) {
          console.error("getUser error:", error.message);
          setUser(null);
          return;
        }

        setUser(user ?? null);
      } catch (err) {
        console.error("Unexpected getUser error:", err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("signOut error:", error.message);
        return;
      }

      window.location.href = "/auth";
    } catch (err) {
      console.error("Unexpected signOut error:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  const { data: profile, isLoading: profileLoading } = useClientProfile(user?.id);
  const { data: bookings, isLoading: bookingsLoading } = useClientBookings(user?.id);
  const { data: favorites, isLoading: favoritesLoading, toggleFavorite } = useFavoriteServices(user?.id);
  const updateProfile = useUpdateClientProfile();
  const cancelBooking = useCancelBooking();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        updates: {
          full_name: profileForm.fullName,
          phone: profileForm.phone,
        },
      });
      toast.success(language === 'sk' ? "Profil bol úspešne aktualizovaný" : "Profile updated successfully");
      setIsProfileDialogOpen(false);
    } catch (err) {
      toast.error(language === 'sk' ? "Nastala chyba pri aktualizácii" : "Update failed");
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingId) return;

    try {
      await cancelBooking.mutateAsync(selectedBookingId);
      toast.success(language === 'sk' ? "Rezervácia bola zrušená" : "Booking cancelled");
      setIsCancelDialogOpen(false);
    } catch (err) {
      toast.error(language === 'sk' ? "Nepodarilo sa zrušiť rezerváciu" : "Cancellation failed");
    }
  };

  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.full_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleProfileUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['client-profile', user?.id] });
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const t = {
    sk: {
      title: 'Dashboard',
      welcome: 'Vitajte späť',
      totalVisits: 'Celkom návštev',
      upcomingAppointments: 'Nadchádzajúce termíny',
      pastAppointments: 'História návštev',
      favorites: 'Obľúbené služby',
      noUpcoming: 'Žiadne nadchádzajúce termíny',
      noPast: 'Žiadna história návštev',
      noFavorites: 'Zatiaľ žiadne obľúbené služby',
      bookNow: 'Rezervovať teraz',
      quickBook: 'Rýchla rezervácia',
      status: {
        pending: 'Čaká na potvrdenie',
        confirmed: 'Potvrdené',
        completed: 'Dokončené',
        cancelled: 'Zrušené',
      },
      therapistNotes: 'Poznámky od Personál FYZIO&FIT',
      favoritesHint: 'Vaše obľúbené služby pre rýchlu rezerváciu',
      addToFavorites: 'Pridať medzi obľúbené',
      editProfile: 'Upraviť profil',
      cancelBooking: 'Zrušiť termín',
      fullName: 'Celé meno',
      phone: 'Telefón',
      saveChanges: 'Uložiť zmeny',
      cancelConfirm: 'Naozaj chcete zrušiť tento termín?',
      cancelDesc: 'Tento krok je nevratný. Ak si ho rozmyslíte, budete si musieť vytvoriť novú rezerváciu.',
      keepTerm: 'Ponechať termín',
    },
    en: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      totalVisits: 'Total visits',
      upcomingAppointments: 'Upcoming Appointments',
      pastAppointments: 'Visit History',
      favorites: 'Favorite Services',
      noUpcoming: 'No upcoming appointments',
      noPast: 'No visit history',
      noFavorites: 'No favorite services yet',
      bookNow: 'Book Now',
      quickBook: 'Quick Book',
      status: {
        pending: 'Pending',
        confirmed: 'Confirmed',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      therapistNotes: 'Notes from Staff of FYZIO&FIT',
      favoritesHint: 'Your favorite services for quick booking',
      addToFavorites: 'Add to favorites',
      editProfile: 'Edit Profile',
      cancelBooking: 'Cancel Appointment',
      fullName: 'Full Name',
      phone: 'Phone',
      saveChanges: 'Save Changes',
      cancelConfirm: 'Are you sure you want to cancel?',
      cancelDesc: 'This action cannot be undone. You will need to make a new booking if you change your mind.',
      keepTerm: 'Keep Appointment',
    },
  };

  const text = t[language];
  const dateLocale = language === 'sk' ? sk : enUS;

  const getStatusBadge = (status: string) => {
    const badgeClasses: Record<string, string> = {
      pending:
        'border-[rgba(79,149,213,0.16)] bg-white/74 text-[hsl(var(--soft-navy))] shadow-[0_10px_22px_rgba(126,195,255,0.12)]',
      confirmed:
        'border-transparent bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] text-white shadow-[0_14px_30px_rgba(79,149,213,0.24)]',
      completed:
        'border-[rgba(64,157,116,0.2)] bg-white/74 text-[hsl(152,55%,32%)] shadow-[0_10px_22px_rgba(64,157,116,0.1)]',
      cancelled:
        'border-transparent bg-destructive text-destructive-foreground shadow-[0_14px_26px_rgba(220,38,38,0.16)]',
    };

    return (
      <Badge
        variant="outline"
        className={cn(
          'border px-3 py-1 text-[11px] font-semibold tracking-[0.02em] backdrop-blur-md',
          badgeClasses[status] || badgeClasses.pending,
        )}
      >
        {text.status[status as keyof typeof text.status] || status}
      </Badge>
    );
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-app-screen relative px-4 py-5 md:px-8 md:py-8">
        <GlassBackground />
        <div className="relative z-10 max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-14 w-72 rounded-[22px]" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-36 rounded-[24px]" />
            <Skeleton className="h-36 rounded-[24px]" />
            <Skeleton className="h-36 rounded-[24px]" />
          </div>
          <Skeleton className="h-96 rounded-[28px]" />
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings?.filter(
    (b) => !isPast(parseISO(`${b.date}T${b.time_slot}`)) && b.status !== 'cancelled',
  ) || [];

  const pastBookings = bookings?.filter(
    (b) => isPast(parseISO(`${b.date}T${b.time_slot}`)) || b.status === 'completed',
  ) || [];

  return (
    <>
      <PageMeta
        titleSk="Klientský portál | FYZIO&FIT"
        titleEn="Client Portal | FYZIO&FIT"
        descriptionSk="Spravujte svoje rezervácie, obľúbené služby a osobné údaje na jednom mieste."
        descriptionEn="Manage your bookings, favorite services and personal details in one place."
        path="/portal"
        noindex
      />
      <div className="min-h-app-screen relative">
        <GlassBackground />

        <header className="sticky top-0 z-50 px-3 pt-3">
          <div className="surface-toolbar max-w-6xl mx-auto flex flex-col gap-3 border border-[var(--glass-border-subtle)] px-4 py-3 shadow-glass-soft sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
            <div className="flex min-w-0 items-center gap-4">
              <button onClick={() => setIsAvatarDialogOpen(true)} className="relative group shrink-0">
                <Avatar className="h-12 w-12 border-2 border-white/70 shadow-[0_14px_30px_rgba(126,195,255,0.16)] group-hover:border-[rgba(79,149,213,0.34)] transition-colors">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                  <AvatarFallback className="bg-white/82 text-[hsl(var(--soft-navy))]">
                    {profile?.full_name ? getInitials(profile.full_name) : <UserIcon className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[rgba(36,71,107,0.3)] opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </button>

              <div className="min-w-0">
                <h1 className="text-xl font-heading font-semibold tracking-tight text-[hsl(var(--soft-navy))] sm:text-2xl">
                  {text.title}
                </h1>
                <p className="truncate text-sm text-muted-foreground">
                  {text.welcome}, {profile?.full_name || user?.email || 'Guest'}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
              <LanguageSwitcher />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsProfileDialogOpen(true)}
                className="h-10 w-10 rounded-2xl border border-[var(--glass-border-subtle)] bg-white/64 text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.12)] hover:bg-white/78 hover:text-[hsl(var(--navy))]"
                title={text.editProfile}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                disabled={loggingOut}
                className="h-10 w-10 rounded-2xl border border-[var(--glass-border-subtle)] bg-white/64 text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.12)] hover:bg-white/78 hover:text-[hsl(var(--navy))]"
                title={language === 'sk' ? 'Odhlásiť sa' : 'Sign Out'}
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-5 md:px-8 md:py-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-[24px] border-[var(--glass-border-subtle)] bg-white/60 shadow-glass-soft">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{text.totalVisits}</p>
                    <p className="text-3xl font-semibold tracking-tight text-[hsl(var(--deep-navy))]">
                      {profile?.total_visits || 0}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/70 bg-white/72 shadow-[0_14px_30px_rgba(126,195,255,0.14)]">
                    <Star className="h-5 w-5 text-[hsl(var(--navy))]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-[var(--glass-border-subtle)] bg-white/60 shadow-glass-soft">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{text.upcomingAppointments}</p>
                    <p className="text-3xl font-semibold tracking-tight text-[hsl(var(--deep-navy))]">
                      {upcomingBookings.length}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/70 bg-white/72 shadow-[0_14px_30px_rgba(126,195,255,0.14)]">
                    <Calendar className="h-5 w-5 text-[hsl(var(--navy))]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer rounded-[24px] border-[rgba(79,149,213,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(216,238,255,0.7)_100%)] shadow-[0_18px_42px_rgba(126,195,255,0.16)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(126,195,255,0.2)]"
              onClick={() => navigate('/')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{text.bookNow}</p>
                    <p className="text-lg font-semibold text-[hsl(var(--deep-navy))]">{text.quickBook}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/20 bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] shadow-[0_16px_34px_rgba(79,149,213,0.3)]">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 rounded-[24px] border-[var(--glass-border-subtle)] bg-white/62 p-1.5">
              <TabsTrigger
                value="upcoming"
                className="min-h-[48px] gap-2 rounded-[14px] px-3 py-3 text-[13px] sm:text-sm data-[state=active]:bg-white/82 data-[state=active]:border-[var(--glass-border)] data-[state=active]:shadow-[0_16px_34px_rgba(126,195,255,0.16)]"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">{text.upcomingAppointments}</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="min-h-[48px] gap-2 rounded-[14px] px-3 py-3 text-[13px] sm:text-sm data-[state=active]:bg-white/82 data-[state=active]:border-[var(--glass-border)] data-[state=active]:shadow-[0_16px_34px_rgba(126,195,255,0.16)]"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">{text.pastAppointments}</span>
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="min-h-[48px] gap-2 rounded-[14px] px-3 py-3 text-[13px] sm:text-sm data-[state=active]:bg-white/82 data-[state=active]:border-[var(--glass-border)] data-[state=active]:shadow-[0_16px_34px_rgba(126,195,255,0.16)]"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">{text.favorites}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <Card className="rounded-[28px] border-[rgba(79,149,213,0.14)] bg-white/64 shadow-[0_18px_42px_rgba(126,195,255,0.14)]">
                <CardHeader>
                  <CardTitle className="text-[hsl(var(--soft-navy))]">{text.upcomingAppointments}</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={`upcoming-skeleton-${i}`} className="h-24 rounded-[22px]" />
                      ))}
                    </div>
                  ) : upcomingBookings.length === 0 ? (
                    <div className="py-14 text-center text-muted-foreground">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px] border border-white/70 bg-white/70 shadow-[0_12px_28px_rgba(126,195,255,0.14)]">
                        <Calendar className="h-6 w-6 text-[hsl(var(--navy))]" />
                      </div>
                      <p>{text.noUpcoming}</p>
                      <Button
                        className="mt-5 rounded-[14px] border border-white/20 bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] px-6 shadow-[0_16px_34px_rgba(79,149,213,0.24)] hover:brightness-[1.03]"
                        onClick={() => navigate('/')}
                      >
                        {text.bookNow}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBookings.map((booking, index) => (
                        <div
                          key={booking.id}
                          className={cn(
                            'flex flex-col gap-3 rounded-[22px] border border-[var(--glass-border-subtle)] bg-white/58 p-4 shadow-[0_12px_28px_rgba(126,195,255,0.1)] transition-all hover:-translate-y-px hover:shadow-[0_18px_34px_rgba(126,195,255,0.14)] sm:flex-row sm:items-center sm:justify-between',
                            index === 0 && 'border-[rgba(79,149,213,0.2)] bg-white/72 shadow-[0_16px_36px_rgba(126,195,255,0.16)]',
                          )}
                        >
                          <div className="space-y-1">
                            <p className="font-semibold text-[hsl(var(--soft-navy))]">{booking.service?.name}</p>
                            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
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
                          <div className="flex items-center gap-2">
                            {getStatusBadge(booking.status)}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                setSelectedBookingId(booking.id);
                                setIsCancelDialogOpen(true);
                              }}
                              className="h-9 w-9 rounded-xl border border-destructive/10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title={text.cancelBooking}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="rounded-[28px] border-[var(--glass-border-subtle)] bg-white/56 shadow-glass-soft">
                <CardHeader>
                  <CardTitle className="text-[hsl(var(--soft-navy))]">{text.pastAppointments}</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={`history-skeleton-${i}`} className="h-24 rounded-[22px]" />
                      ))}
                    </div>
                  ) : pastBookings.length === 0 ? (
                    <div className="py-14 text-center text-muted-foreground">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px] border border-white/70 bg-white/70 shadow-[0_12px_28px_rgba(126,195,255,0.14)]">
                        <History className="h-6 w-6 text-[hsl(var(--navy))]" />
                      </div>
                      <p>{text.noPast}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="rounded-[22px] border border-[var(--glass-border-subtle)] bg-white/58 p-4 shadow-[0_12px_28px_rgba(126,195,255,0.1)]"
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="font-semibold text-[hsl(var(--soft-navy))]">{booking.service?.name}</p>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="mb-2 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
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
                            <div className="mt-3 border-t border-[var(--glass-border-subtle)] pt-3">
                              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[hsl(var(--soft-navy))]">
                                <FileText className="h-4 w-4" />
                                {text.therapistNotes}
                              </p>
                              {booking.therapist_notes.map((note) => (
                                <p
                                  key={note.id}
                                  className="rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/66 p-3 text-sm text-muted-foreground"
                                >
                                  {note.note}
                                </p>
                              ))}
                            </div>
                          )}
                          <Button
                            variant="glass"
                            size="sm"
                            className="mt-3 rounded-[14px]"
                            onClick={() => {
                              if (booking.service) {
                                toggleFavorite(booking.service.id);
                              }
                            }}
                          >
                            <Heart
                              className={cn(
                                'mr-2 h-4 w-4',
                                favorites?.some((f) => f.service_id === booking.service?.id)
                                  ? 'fill-current text-destructive'
                                  : '',
                              )}
                            />
                            {text.addToFavorites}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card className="rounded-[28px] border-[var(--glass-border-subtle)] bg-white/56 shadow-glass-soft">
                <CardHeader>
                  <CardTitle className="text-[hsl(var(--soft-navy))]">{text.favorites}</CardTitle>
                  <CardDescription>{text.favoritesHint}</CardDescription>
                </CardHeader>
                <CardContent>
                  {favoritesLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[1, 2].map((i) => (
                        <Skeleton key={`fav-skeleton-${i}`} className="h-32 rounded-[22px]" />
                      ))}
                    </div>
                  ) : !favorites || favorites.length === 0 ? (
                    <div className="py-14 text-center text-muted-foreground">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px] border border-white/70 bg-white/70 shadow-[0_12px_28px_rgba(126,195,255,0.14)]">
                        <Heart className="h-6 w-6 text-[hsl(var(--navy))]" />
                      </div>
                      <p>{text.noFavorites}</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {favorites.map((fav) => (
                        <div
                          key={fav.id}
                          className="rounded-[22px] border border-[var(--glass-border-subtle)] bg-white/58 p-4 shadow-[0_12px_28px_rgba(126,195,255,0.1)] transition-all hover:-translate-y-px hover:shadow-[0_18px_34px_rgba(126,195,255,0.14)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[hsl(var(--soft-navy))]">{fav.service?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {fav.service?.duration} min • €{fav.service?.price}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => toggleFavorite(fav.service_id)}>
                              <Heart className="h-4 w-4 fill-current text-destructive" />
                            </Button>
                          </div>
                          <Button
                            className="mt-4 w-full rounded-[14px] border border-white/20 bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] shadow-[0_16px_34px_rgba(79,149,213,0.24)] hover:brightness-[1.03]"
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

        {/* Edit Profile Dialog */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="sm:max-w-[425px] border-[var(--glass-border-subtle)] bg-white/94 backdrop-blur-xl rounded-[28px] p-6 shadow-glass-float">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading font-semibold text-[hsl(var(--soft-navy))]">{text.editProfile}</DialogTitle>
              <DialogDescription>
                {language === 'sk' ? 'Upravte svoje kontaktné údaje pre rýchlejšie rezervácie.' : 'Update your contact details for faster bookings.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateProfile} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium pl-1">{text.fullName}</Label>
                <Input
                  id="fullName"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="rounded-2xl bg-white/50 border-[var(--glass-border-subtle)] focus:ring-primary/20 h-12"
                  placeholder="Peter Novák"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium pl-1">{text.phone}</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="rounded-2xl bg-white/50 border-[var(--glass-border-subtle)] focus:ring-primary/20 h-12"
                  placeholder="+421 900 000 000"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={updateProfile.isPending} className="w-full h-12 rounded-[18px] bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] text-white font-semibold">
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : text.saveChanges}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Cancel Booking AlertDialog */}
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent className="border-[var(--glass-border-subtle)] bg-white/96 backdrop-blur-xl rounded-[28px] p-8 shadow-glass-float">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-heading font-semibold text-[hsl(var(--soft-navy))]">
                {text.cancelConfirm}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base pt-2">
                {text.cancelDesc}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-3 pt-6">
              <AlertDialogCancel className="h-12 rounded-[18px] flex-1 border-[var(--glass-border-subtle)] bg-white/40 font-medium">
                {text.keepTerm}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCancelBooking}
                disabled={cancelBooking.isPending}
                className="h-12 rounded-[18px] flex-1 bg-destructive hover:bg-destructive/90 text-white border-0 shadow-lg shadow-destructive/20 font-semibold"
              >
                {cancelBooking.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : text.cancelBooking}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default ClientPortal;
