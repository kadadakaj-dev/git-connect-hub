import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowLeft, CalendarDays, Clock, Heart, Star } from 'lucide-react';
import { z } from 'zod';
import GlassBackground from '@/components/GlassBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const loginSchema = z.object({
  email: z.string().email('Neplatný email'),
  password: z.string().min(6, 'Heslo musí mať aspoň 6 znakov'),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Meno musí mať aspoň 2 znaky'),
  phone: z.string().optional(),
});

const menuItems = [
  { icon: CalendarDays, label: { sk: 'Rezervácie', en: 'Bookings' }, active: false },
  { icon: Clock, label: { sk: 'História', en: 'History' }, active: false },
  { icon: Heart, label: { sk: 'Obľúbené', en: 'Favorites' }, active: false },
  { icon: Star, label: { sk: 'Prihlásenie', en: 'Sign In' }, active: true },
];

const authInputClass =
  'h-12 rounded-[16px] border-[var(--glass-border-subtle)] bg-white/72 text-[hsl(var(--soft-navy))] placeholder:text-muted-foreground/70 shadow-[0_10px_24px_rgba(126,195,255,0.08)] focus-visible:border-[rgba(79,149,213,0.34)] focus-visible:ring-2 focus-visible:ring-[rgba(126,195,255,0.28)] focus-visible:shadow-[0_0_0_4px_rgba(126,195,255,0.12)] focus-visible:bg-white/82';

const submitButtonClass =
  'h-12 w-full rounded-[14px] border border-white/20 bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] text-white shadow-[0_18px_36px_rgba(79,149,213,0.26)] hover:brightness-[1.03]';

const ClientAuth = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const profileCreatedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Create profile on first verified login (not during unverified signup)
        if (!profileCreatedRef.current) {
          profileCreatedRef.current = true;
          const { data: existing } = await supabase
            .from('client_profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();
          if (!existing) {
            await supabase.from('client_profiles').insert({
              user_id: session.user.id,
              full_name: session.user.user_metadata?.full_name || null,
              phone: session.user.user_metadata?.phone || null,
              preferred_language: language,
            });
          }
        }
        navigate('/portal');
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate('/portal');
    });
    return () => subscription.unsubscribe();
  }, [navigate, language]);
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
        toast.success(
          language === 'sk'
            ? 'Registrácia úspešná! Skontrolujte email pre overenie.'
            : 'Registration successful! Check your email for verification.',
        );
      }
    } catch {
      toast.error(language === 'sk' ? 'Niečo sa pokazilo' : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      const { lovable } = await import('@/integrations/lovable/index');
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/portal`,
      });
      if (result.error) {
        toast.error(
          language === 'sk' 
            ? `Chyba pri prihlásení cez ${provider === 'google' ? 'Google' : 'Apple'}`
            : `Error signing in with ${provider === 'google' ? 'Google' : 'Apple'}`
        );
      }
    } catch {
      toast.error(language === 'sk' ? 'Niečo sa pokazilo' : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error(language === 'sk' ? 'Zadajte email' : 'Enter your email');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/portal`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(
          language === 'sk'
            ? 'Email na obnovenie hesla bol odoslaný. Skontrolujte svoju schránku.'
            : 'Password reset email sent. Check your inbox.'
        );
        setShowForgotPassword(false);
        setResetEmail('');
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
      backToBooking: 'Späť na rezerváciu',
      welcome: 'Vitajte späť',
      welcomeSub: 'Spravujte svoje rezervácie a obľúbené služby',
      guest: 'Hosť',
      guestState: 'Neprihlásený',
      forgotPassword: 'Zabudli ste heslo?',
      resetPassword: 'Obnoviť heslo',
      backToLogin: 'Späť na prihlásenie',
      resetInstructions: 'Zadajte email a pošleme vám odkaz na obnovenie hesla.',
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
      backToBooking: 'Back to booking',
      welcome: 'Welcome back',
      welcomeSub: 'Manage your bookings and favorite services',
      guest: 'Guest',
      guestState: 'Not signed in',
      forgotPassword: 'Forgot password?',
      resetPassword: 'Reset Password',
      backToLogin: 'Back to login',
      resetInstructions: 'Enter your email and we\'ll send you a reset link.',
    },
  };

  const text = t[language];

  return (
    <>
      <PageMeta
        titleSk="Prihlásenie | FYZIO&FIT"
        titleEn="Sign In | FYZIO&FIT"
        descriptionSk="Prihláste sa do klientského portálu FYZIO&FIT pre správu rezervácií a obľúbených služieb."
        descriptionEn="Sign in to FYZIO&FIT client portal to manage bookings and favorite services."
        path="/auth"
      />

      <div className="relative flex min-h-app-screen overflow-hidden">
        <GlassBackground />

        <aside className="hidden w-[296px] shrink-0 flex-col border-r border-[var(--glass-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(234,246,255,0.58)_100%)] p-5 backdrop-blur-2xl lg:flex xl:p-6">
          <div className="mb-10 text-center">
            <span className="font-heading text-3xl font-semibold tracking-[0.16em] text-[hsl(var(--soft-navy))]">
              FYZIO&FIT
            </span>
          </div>

          <nav className="flex-1">
            <ul className="space-y-2">
              {menuItems.map((item, i) => {
                const Icon = item.icon;

                return (
                  <li
                    key={i}
                    className={`relative rounded-[24px] border transition-all duration-200 ${item.active
                      ? 'border-[rgba(79,149,213,0.16)] bg-white/76 shadow-[0_10px_22px_rgba(126,195,255,0.1)]'
                      : 'border-transparent hover:border-[var(--glass-border-subtle)] hover:bg-white/50'
                      }`}
                  >
                    {item.active && (
                      <span className="absolute -left-5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-sm bg-[linear-gradient(180deg,#24476B_0%,#4F95D5_100%)]" />
                    )}
                    <span className="flex items-center gap-3.5 px-4 py-3 text-[15px] font-medium tracking-wide text-[hsl(var(--soft-navy))]">
                      <Icon className={`h-5 w-5 ${item.active ? 'opacity-100' : 'opacity-65'}`} />
                      {item.label[language]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto flex items-center gap-3 rounded-[24px] border border-[var(--glass-border-subtle)] bg-white/68 p-4 shadow-[0_10px_22px_rgba(126,195,255,0.1)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/82">
              <User className="h-5 w-5 text-[hsl(var(--navy))]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[hsl(var(--soft-navy))]">{text.guest}</p>
              <p className="text-xs text-muted-foreground">{text.guestState}</p>
            </div>
          </div>
        </aside>

        <main className="relative z-10 flex flex-1 flex-col overflow-y-auto">
          <div className="px-3 pt-3 lg:px-8 lg:pt-8">
            <div className="surface-toolbar mx-auto flex w-full max-w-5xl items-center justify-between border border-[var(--glass-border-subtle)] px-3 py-2 shadow-glass-soft sm:px-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="rounded-[14px] border border-[var(--glass-border-subtle)] bg-white/60 px-4 text-[hsl(var(--soft-navy))] hover:bg-white/78 hover:text-[hsl(var(--navy))]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {text.backToBooking}
              </Button>
              <LanguageSwitcher />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
            <div className="w-full max-w-md space-y-5">
              <div className="mb-2 text-center lg:text-left">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--navy))]/75">
                  {text.title}
                </p>
                <h1 className="mb-2 font-heading text-3xl font-semibold tracking-tight text-[hsl(var(--soft-navy))] lg:text-4xl">
                  {text.welcome}
                </h1>
                <p className="text-base text-muted-foreground">{text.subtitle}</p>
              </div>

              <div className="surface-panel rounded-[28px] border border-[var(--glass-border)] p-6 shadow-glass-float lg:p-8">
                {showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-semibold text-[hsl(var(--soft-navy))]">{text.resetPassword}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{text.resetInstructions}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reset-email" className="text-sm font-medium text-[hsl(var(--soft-navy))]">
                        {text.email}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="email@example.com"
                          className={`pl-10 ${authInputClass}`}
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className={submitButtonClass}>
                      {isLoading ? '...' : text.resetPassword}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="w-full text-center text-sm text-muted-foreground hover:text-[hsl(var(--soft-navy))] transition-colors"
                    >
                      {text.backToLogin}
                    </button>
                  </form>
                ) : (
                  <>
                    {/* <div className="space-y-3 mb-6">
                      <Button
                        variant="outline"
                        type="button"
                        className="w-full h-12 rounded-[14px] border-[var(--glass-border-subtle)] bg-white/72 shadow-glass-soft flex items-center justify-center gap-3 text-[hsl(var(--soft-navy))] font-medium hover:bg-white/88"
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        {language === 'sk' ? 'Pokračovať s Google' : 'Continue with Google'}
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        className="w-full h-12 rounded-[14px] border-[var(--glass-border-subtle)] bg-white/72 shadow-glass-soft flex items-center justify-center gap-3 text-[hsl(var(--soft-navy))] font-medium hover:bg-white/88"
                        onClick={() => handleOAuthSignIn('apple')}
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M17.05 20.28c-.96.95-2.21 1.72-3.72 1.72-1.47 0-2.11-.87-3.62-.87-1.55 0-2.3.87-3.62.87-1.47 0-2.84-.81-3.72-1.72-1.89-1.93-1.89-5.11 0-7.05 1.05-1.07 2.4-1.68 3.72-1.68 1.47 0 2.15.84 3.62.84 1.51 0 2.03-.84 3.65-.84 1.3 0 2.65.61 3.7 1.68-.31.3-.61.64-.81 1.03-.66 1.25-.66 2.76 0 4.01s.5 1.17.8 1.51c-.01.18-.01.35-.02.53zM12.16 4.1c.01-.2.01-.4.01-.61 0-1.71-1.39-3.11-3.1-3.11-.01.21-.01.41-.01.61 0 1.71 1.39 3.11 3.1 3.11z"
                          />
                        </svg>
                        {language === 'sk' ? 'Pokračovať s Apple' : 'Continue with Apple'}
                      </Button>
                    </div>

                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[var(--glass-border-subtle)]"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white/50 px-2 text-muted-foreground backdrop-blur-sm">
                          {language === 'sk' ? 'Alebo pokračujte s emailom' : 'Or continue with email'}
                        </span>
                      </div>
                    </div> */}

                    <Tabs defaultValue="login" className="w-full">
                      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/50 p-1">
                        <TabsTrigger
                          value="login"
                          className="min-h-[44px] rounded-[14px] text-sm font-semibold tracking-wide data-[state=active]:bg-white/88 data-[state=active]:border data-[state=active]:border-[var(--glass-border)] data-[state=active]:shadow-[0_12px_24px_rgba(126,195,255,0.18)] data-[state=inactive]:text-muted-foreground"
                        >
                          {text.login}
                        </TabsTrigger>
                        <TabsTrigger
                          value="register"
                          className="min-h-[44px] rounded-[14px] text-sm font-semibold tracking-wide data-[state=active]:bg-white/88 data-[state=active]:border data-[state=active]:border-[var(--glass-border)] data-[state=active]:shadow-[0_12px_24px_rgba(126,195,255,0.18)] data-[state=inactive]:text-muted-foreground"
                        >
                          {text.register}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="login" className="mt-5 space-y-4">
                        <form onSubmit={handleEmailSignIn} className="space-y-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="login-email" className="text-sm font-medium text-[hsl(var(--soft-navy))]">
                              {text.email}
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="login-email"
                                type="email"
                                placeholder="email@example.com"
                                className={`pl-10 ${authInputClass}`}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              />
                            </div>
                            {errors.email && <p role="alert" className="text-sm text-destructive">{errors.email}</p>}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="login-password" className="text-sm font-medium text-[hsl(var(--soft-navy))]">
                              {text.password}
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="login-password"
                                type="password"
                                className={`pl-10 ${authInputClass}`}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              />
                            </div>
                            {errors.password && <p role="alert" className="text-sm text-destructive">{errors.password}</p>}
                          </div>

                          <Button type="submit" disabled={isLoading} className={submitButtonClass}>
                            {isLoading ? '...' : text.signIn}
                          </Button>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="w-full text-center text-sm text-muted-foreground hover:text-[hsl(var(--soft-navy))] transition-colors"
                          >
                            {text.forgotPassword}
                          </button>
                        </form>
                      </TabsContent>

                      <TabsContent value="register" className="mt-5 space-y-4">
                        <form onSubmit={handleEmailSignUp} className="space-y-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="register-name" className="text-sm font-medium text-[hsl(var(--soft-navy))]">
                              {text.fullName}
                            </Label>
                            <div className="relative">
                              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="register-name"
                                type="text"
                                className={`pl-10 ${authInputClass}`}
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              />
                            </div>
                            {errors.fullName && <p role="alert" className="text-sm text-destructive">{errors.fullName}</p>}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="register-email" className="text-sm font-medium text-[hsl(var(--soft-navy))]">
                              {text.email}
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="register-email"
                                type="email"
                                placeholder="email@example.com"
                                className={`pl-10 ${authInputClass}`}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              />
                            </div>
                            {errors.email && <p role="alert" className="text-sm text-destructive">{errors.email}</p>}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="register-phone" className="text-sm font-medium text-[hsl(var(--soft-navy))]">
                              {text.phone}
                            </Label>
                            <Input
                              id="register-phone"
                              type="tel"
                              className={authInputClass}
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="register-password" className="text-sm font-medium text-[hsl(var(--soft-navy))]">
                              {text.password}
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="register-password"
                                type="password"
                                className={`pl-10 ${authInputClass}`}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              />
                            </div>
                            {errors.password && <p role="alert" className="text-sm text-destructive">{errors.password}</p>}
                          </div>

                          <Button type="submit" disabled={isLoading} className={submitButtonClass}>
                            {isLoading ? '...' : text.signUp}
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ClientAuth;
