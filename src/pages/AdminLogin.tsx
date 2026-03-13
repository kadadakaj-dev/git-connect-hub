import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import { Shield, Mail, Lock, ArrowLeft, Settings, Users, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

const sidebarItems = [
  { icon: CalendarDays, label: { sk: 'Kalendár', en: 'Calendar' }, active: false },
  { icon: Users, label: { sk: 'Zamestnanci', en: 'Employees' }, active: false },
  { icon: Settings, label: { sk: 'Nastavenia', en: 'Settings' }, active: false },
  { icon: Shield, label: { sk: 'Prihlásenie', en: 'Sign In' }, active: true },
];

const AdminLogin = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(language === 'sk' ? 'Nesprávne prihlasovacie údaje' : 'Invalid credentials');
        setIsLoading(false);
        return;
      }
      if (data.user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'admin')
          .single();
        if (roleError || !roleData) {
          await supabase.auth.signOut();
          toast.error(language === 'sk' ? 'Nemáte administrátorské oprávnenia' : 'You do not have admin permissions');
          setIsLoading(false);
          return;
        }
        toast.success(language === 'sk' ? 'Úspešne prihlásený' : 'Successfully logged in');
        navigate('/admin');
      }
    } catch {
      toast.error(language === 'sk' ? 'Chyba pri prihlásení' : 'Login error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast.error(language === 'sk' ? 'Zadajte email' : 'Enter your email');
      return;
    }
    setIsSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setIsSendingReset(false);
    if (error) {
      toast.error(language === 'sk' ? 'Chyba pri odosielaní' : 'Error sending reset email');
    } else {
      toast.success(language === 'sk' ? 'Email na reset hesla bol odoslaný' : 'Password reset email sent');
    }
  };

  const t = {
    sk: {
      title: 'Admin Panel',
      subtitle: 'Prihláste sa do administrátorského rozhrania',
      signIn: 'Prihlásiť sa',
      signingIn: 'Prihlasujem...',
      forgotPassword: 'Zabudnuté heslo?',
      sending: 'Odosielam...',
      back: 'Späť na rezervácie',
      password: 'Heslo',
    },
    en: {
      title: 'Admin Panel',
      subtitle: 'Sign in to the admin dashboard',
      signIn: 'Sign In',
      signingIn: 'Signing in...',
      forgotPassword: 'Forgot password?',
      sending: 'Sending...',
      back: 'Back to bookings',
      password: 'Password',
    },
  };
  const text = t[language];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary/90 via-primary/70 to-ring/80 overflow-hidden">
      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      {/* Glassmorphism Sidebar — desktop only */}
      <aside className="hidden lg:flex w-[280px] flex-col p-6 bg-white/10 backdrop-blur-2xl border-r border-white/10">
        <div className="text-center mb-10">
          <span className="text-3xl font-semibold text-white tracking-tight">FYZIO&FIT</span>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {sidebarItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <li
                  key={i}
                  className={`relative rounded-2xl transition-all duration-200 ${
                    item.active
                      ? 'bg-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]'
                      : 'hover:bg-white/15 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]'
                  }`}
                >
                  {item.active && (
                    <span className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-sm" />
                  )}
                  <span className="flex items-center gap-3.5 px-4 py-3 text-white font-medium tracking-wide text-[15px]">
                    <Icon className="w-5 h-5 opacity-90" />
                    {item.label[language]}
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto p-4 bg-white/12 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white/80" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-xs text-white/60">{language === 'sk' ? 'Neprihlásený' : 'Not signed in'}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Back button */}
        <div className="p-4 lg:p-8 lg:pb-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </button>
        </div>

        {/* Center card */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-md space-y-6"
          >
            {/* Header */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 mb-4 lg:mx-0 mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-2">
                {text.title}
              </h1>
              <p className="text-base text-white/70">{text.subtitle}</p>
            </div>

            {/* Glassmorphism form card */}
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 lg:p-8">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-white/80 text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-white/10 border-white/15 text-white placeholder:text-white/30 rounded-xl focus:border-white/40 focus:ring-white/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-white/80 text-sm font-medium">{text.password}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 bg-white/10 border-white/15 text-white placeholder:text-white/30 rounded-xl focus:border-white/40 focus:ring-white/20"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-white/90 hover:bg-white text-primary font-semibold text-sm transition-all duration-200 disabled:opacity-50 shadow-lg shadow-black/5 mt-2"
                >
                  {isLoading ? text.signingIn : text.signIn}
                </button>

                <button
                  type="button"
                  disabled={isSendingReset}
                  onClick={handleResetPassword}
                  className="w-full text-center text-white/50 hover:text-white/80 text-sm transition-colors py-1"
                >
                  {isSendingReset ? text.sending : text.forgotPassword}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
