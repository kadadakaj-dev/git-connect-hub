import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowLeft, CalendarDays, Clock, Heart, Star } from 'lucide-react';
import { z } from 'zod';
import GlassBackground from '@/components/GlassBackground';

const loginSchema = z.object({
  email: z.string().email('Neplatný email'),
  password: z.string().min(6, 'Heslo musí mať aspoň 6 znakov'),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Meno musí mať aspoň 2 znaky'),
  phone: z.string().optional(),
});

// Sidebar menu items
const menuItems = [
  { icon: CalendarDays, label: { sk: 'Rezervácie', en: 'Bookings' }, active: false },
  { icon: Clock, label: { sk: 'História', en: 'History' }, active: false },
  { icon: Heart, label: { sk: 'Obľúbené', en: 'Favorites' }, active: false },
  { icon: Star, label: { sk: 'Prihlásenie', en: 'Sign In' }, active: true },
];

const ClientAuth = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) navigate('/portal');
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate('/portal');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin + '/portal',
      });
      if (error) toast.error(language === 'sk' ? 'Chyba pri prihlásení cez Google' : 'Error signing in with Google');
    } catch {
      toast.error(language === 'sk' ? 'Niečo sa pokazilo' : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('apple', {
        redirect_uri: window.location.origin + '/portal',
      });
      if (error) toast.error(language === 'sk' ? 'Chyba pri prihlásení cez Apple' : 'Error signing in with Apple');
    } catch {
      toast.error(language === 'sk' ? 'Niečo sa pokazilo' : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error(language === 'sk' ? 'Nesprávny email alebo heslo' : 'Invalid email or password');
        } else {
          toast.error(error.message);
        }
      }
    } catch {
      toast.error(language === 'sk' ? 'Niečo sa pokazilo' : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/portal`,
          data: { full_name: formData.fullName, phone: formData.phone },
        },
      });
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error(language === 'sk' ? 'Email je už zaregistrovaný' : 'Email already registered');
        } else {
          toast.error(error.message);
        }
      } else if (data.user) {
        await supabase.from('client_profiles').insert({
          user_id: data.user.id,
          full_name: formData.fullName,
          phone: formData.phone || null,
          preferred_language: language,
        });
        toast.success(
          language === 'sk'
            ? 'Registrácia úspešná! Skontrolujte email pre overenie.'
            : 'Registration successful! Check your email for verification.'
        );
      }
    } catch {
      toast.error(language === 'sk' ? 'Niečo sa pokazilo' : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const t = {
    sk: {
      title: 'Klientský portál',
      subtitle: 'Prihláste sa pre prístup k histórii návštev a rýchlym rezerváciám',
      login: 'Prihlásenie',
      register: 'Registrácia',
      email: 'Email',
      password: 'Heslo',
      fullName: 'Celé meno',
      phone: 'Telefón (nepovinné)',
      signIn: 'Prihlásiť sa',
      signUp: 'Zaregistrovať sa',
      orContinueWith: 'alebo pokračujte s',
      googleSignIn: 'Pokračovať s Google',
      appleSignIn: 'Pokračovať s Apple',
      backToBooking: 'Späť na rezerváciu',
      welcome: 'Vitajte späť',
      welcomeSub: 'Spravujte svoje rezervácie a obľúbené služby',
    },
    en: {
      title: 'Client Portal',
      subtitle: 'Sign in to access your visit history and quick bookings',
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      fullName: 'Full Name',
      phone: 'Phone (optional)',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      orContinueWith: 'or continue with',
      googleSignIn: 'Continue with Google',
      appleSignIn: 'Continue with Apple',
      backToBooking: 'Back to booking',
      welcome: 'Welcome back',
      welcomeSub: 'Manage your bookings and favorite services',
    },
  };

  const text = t[language];

  return (
    <>
      <Helmet>
        <title>{text.title} | FYZIO&FIT</title>
      </Helmet>

      <div className="min-h-screen flex bg-gradient-to-br from-slate-100 via-blue-50/80 to-slate-200 overflow-hidden">
        {/* Glassmorphism Sidebar — hidden on mobile */}
        <aside className="hidden lg:flex w-[280px] flex-col p-6 bg-white/70 backdrop-blur-2xl border-r border-black/5">
          {/* Logo */}
          <div className="text-center mb-10">
            <span className="text-3xl font-semibold text-foreground tracking-tight">FYZIO&FIT</span>
          </div>

          {/* Menu */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li
                    key={i}
                  className={`relative rounded-2xl transition-all duration-200 ${
                    item.active
                      ? 'bg-primary/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]'
                      : 'hover:bg-black/5 hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]'
                  }`}
                >
                  {item.active && (
                    <span className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-sm" />
                  )}
                  <span className="flex items-center gap-3.5 px-4 py-3 text-foreground font-medium tracking-wide text-[15px]">
                    <Icon className="w-5 h-5 opacity-70" />
                    {item.label[language]}
                  </span>
                </li>
                );
              })}
            </ul>
          </nav>

          {/* Profile placeholder */}
          <div className="mt-auto p-4 bg-white/60 rounded-2xl border border-black/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{language === 'sk' ? 'Hosť' : 'Guest'}</p>
              <p className="text-xs text-muted-foreground">{language === 'sk' ? 'Neprihlásený' : 'Not signed in'}</p>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Mobile header */}
          <div className="lg:hidden p-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground hover:bg-black/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {text.backToBooking}
            </Button>
          </div>

          {/* Desktop back button */}
          <div className="hidden lg:block p-8 pb-0">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground hover:bg-black/5 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {text.backToBooking}
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
            <div className="w-full max-w-md space-y-6">
              {/* Welcome header */}
              <div className="text-center lg:text-left mb-2">
                <h1 className="text-3xl lg:text-4xl font-semibold text-foreground tracking-tight mb-2">
                  {text.welcome}
                </h1>
                <p className="text-base text-muted-foreground">{text.welcomeSub}</p>
              </div>

              {/* Glassmorphism auth card */}
              <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.6)] p-6 lg:p-8 space-y-6">
                {/* OAuth buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-black/5 hover:bg-black/10 border border-black/5 hover:border-black/10 text-foreground font-medium text-[15px] transition-all duration-200 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {text.googleSignIn}
                  </button>

                  <button
                    onClick={handleAppleSignIn}
                    disabled={isLoading}
                    className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-black/5 hover:bg-black/10 border border-black/5 hover:border-black/10 text-foreground font-medium text-[15px] transition-all duration-200 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    {text.appleSignIn}
                  </button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/40" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-3 text-muted-foreground bg-transparent">
                      {text.orContinueWith}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-black/5 rounded-xl border border-black/5 p-1">
                    <TabsTrigger
                      value="login"
                      className="rounded-lg text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm font-medium text-sm transition-all"
                    >
                      {text.login}
                    </TabsTrigger>
                    <TabsTrigger
                      value="register"
                      className="rounded-lg text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm font-medium text-sm transition-all"
                    >
                      {text.register}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4 mt-5">
                    <form onSubmit={handleEmailSignIn} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="login-email" className="text-foreground text-sm font-medium">{text.email}</Label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="email@example.com"
                            className="pl-10 h-11 bg-white/70 border-border/40 text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-primary/20"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="login-password" className="text-foreground text-sm font-medium">{text.password}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type="password"
                            className="pl-10 h-11 bg-white/70 border-border/40 text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-primary/20"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          />
                        </div>
                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all duration-200 disabled:opacity-50 shadow-lg shadow-primary/20"
                      >
                        {isLoading ? '...' : text.signIn}
                      </button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4 mt-5">
                    <form onSubmit={handleEmailSignUp} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="register-name" className="text-foreground text-sm font-medium">{text.fullName}</Label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-name"
                            type="text"
                            className="pl-10 h-11 bg-white/70 border-border/40 text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-primary/20"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          />
                        </div>
                        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="register-email" className="text-foreground text-sm font-medium">{text.email}</Label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="email@example.com"
                            className="pl-10 h-11 bg-white/70 border-border/40 text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-primary/20"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="register-phone" className="text-foreground text-sm font-medium">{text.phone}</Label>
                        <Input
                          id="register-phone"
                          type="tel"
                          className="h-11 bg-white/70 border-border/40 text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-primary/20"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="register-password" className="text-foreground text-sm font-medium">{text.password}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-password"
                            type="password"
                            className="pl-10 h-11 bg-white/70 border-border/40 text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-primary/20"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          />
                        </div>
                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all duration-200 disabled:opacity-50 shadow-lg shadow-primary/20"
                      >
                        {isLoading ? '...' : text.signUp}
                      </button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ClientAuth;
