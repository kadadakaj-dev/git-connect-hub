import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { Lock, KeyRound } from 'lucide-react';

const AdminResetPassword = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsValidSession(true);
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setIsValidSession(true);
        } else {
          toast.error(language === 'sk' ? 'Neplatný alebo expirovaný odkaz' : 'Invalid or expired link');
          navigate('/admin/login');
        }
      });
    }
  }, [navigate, language]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(language === 'sk' ? 'Heslo musí mať aspoň 6 znakov' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error(language === 'sk' ? 'Heslá sa nezhodujú' : 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast.error(language === 'sk' ? 'Chyba pri zmene hesla' : 'Error changing password');
    } else {
      toast.success(language === 'sk' ? 'Heslo bolo úspešne zmenené' : 'Password changed successfully');
      navigate('/admin');
    }
  };

  if (!isValidSession) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/80 to-slate-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {language === 'sk' ? 'Nové heslo' : 'New Password'}
          </CardTitle>
          <CardDescription>
            {language === 'sk' ? 'Zadajte nové heslo pre váš účet' : 'Enter a new password for your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{language === 'sk' ? 'Nové heslo' : 'New password'}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{language === 'sk' ? 'Potvrďte heslo' : 'Confirm password'}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (language === 'sk' ? 'Ukladám...' : 'Saving...') : (language === 'sk' ? 'Zmeniť heslo' : 'Change Password')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResetPassword;