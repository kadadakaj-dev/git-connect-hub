import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings,
  UserPen,
  KeyRound,
  Bell,
  Trash2,
  LogOut,
  Loader2,
  Lock,
} from 'lucide-react';

interface SettingsMenuProps {
  onEditProfile: () => void;
  onSignOut: () => void;
  emailNotifications: boolean;
  userId: string;
  userEmail: string;
}

const SettingsMenu = ({
  onEditProfile,
  onSignOut,
  emailNotifications,
  userId,
  userEmail,
}: SettingsMenuProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(emailNotifications);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState<string | null>(null);

  const t = {
    sk: {
      settings: 'Nastavenia',
      editProfile: 'Upraviť profil',
      changePassword: 'Zmeniť heslo',
      notifications: 'Emailové notifikácie',
      deleteAccount: 'Vymazať účet',
      signOut: 'Odhlásiť sa',
      deleteTitle: 'Vymazať účet?',
      deleteDescription: 'Táto akcia je nezvratná. Všetky vaše údaje, rezervácie a história budú natrvalo vymazané.',
      deleteConfirm: 'Áno, vymazať účet',
      deleteCancel: 'Zrušiť',
      deleting: 'Mazanie...',
      deleteSuccess: 'Účet bol vymazaný',
      deleteError: 'Chyba pri mazaní účtu',
      passwordTitle: 'Zmeniť heslo',
      passwordDescription: 'Zadajte nové heslo pre váš účet',
      newPassword: 'Nové heslo',
      confirmPassword: 'Potvrďte heslo',
      passwordSave: 'Zmeniť heslo',
      passwordSaving: 'Ukladám...',
      passwordSuccess: 'Heslo bolo zmenené',
      passwordError: 'Chyba pri zmene hesla',
      passwordMismatch: 'Heslá sa nezhodujú',
      passwordTooShort: 'Heslo musí mať aspoň 6 znakov',
      notificationsOn: 'Notifikácie zapnuté',
      notificationsOff: 'Notifikácie vypnuté',
    },
    en: {
      settings: 'Settings',
      editProfile: 'Edit Profile',
      changePassword: 'Change Password',
      notifications: 'Email Notifications',
      deleteAccount: 'Delete Account',
      signOut: 'Sign Out',
      deleteTitle: 'Delete Account?',
      deleteDescription: 'This action is irreversible. All your data, bookings, and history will be permanently deleted.',
      deleteConfirm: 'Yes, delete account',
      deleteCancel: 'Cancel',
      deleting: 'Deleting...',
      deleteSuccess: 'Account deleted',
      deleteError: 'Error deleting account',
      passwordTitle: 'Change Password',
      passwordDescription: 'Enter a new password for your account',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      passwordSave: 'Change Password',
      passwordSaving: 'Saving...',
      passwordSuccess: 'Password changed successfully',
      passwordError: 'Error changing password',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      notificationsOn: 'Notifications enabled',
      notificationsOff: 'Notifications disabled',
    },
  };

  const text = t[language];

  const handleToggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);

    const { error } = await supabase
      .from('client_profiles')
      .update({ email_notifications: newValue })
      .eq('user_id', userId);

    if (error) {
      setNotificationsEnabled(!newValue);
      toast.error(language === 'sk' ? 'Chyba pri aktualizácii' : 'Update failed');
    } else {
      toast.success(newValue ? text.notificationsOn : text.notificationsOff);
    }
  };

  const handleChangePassword = async () => {
    setPasswordErrors(null);

    if (passwords.newPassword.length < 6) {
      setPasswordErrors(text.passwordTooShort);
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordErrors(text.passwordMismatch);
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
    setIsChangingPassword(false);

    if (error) {
      toast.error(text.passwordError);
    } else {
      toast.success(text.passwordSuccess);
      setPasswords({ newPassword: '', confirmPassword: '' });
      setIsPasswordDialogOpen(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;

      toast.success(text.deleteSuccess);
      await supabase.auth.signOut();
      navigate('/');
    } catch {
      toast.error(text.deleteError);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-2xl border border-[var(--glass-border-subtle)] bg-white/64 text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.12)] hover:bg-white/78 hover:text-[hsl(var(--navy))]"
            aria-label="Settings menu"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-60 rounded-2xl border-[var(--glass-border)] bg-[var(--glass-white-lg)] backdrop-blur-2xl shadow-glass-float"
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            {userEmail}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onEditProfile} className="gap-2 cursor-pointer">
            <UserPen className="h-4 w-4" />
            {text.editProfile}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)} className="gap-2 cursor-pointer">
            <KeyRound className="h-4 w-4" />
            {text.changePassword}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              handleToggleNotifications();
            }}
          >
            <Bell className="h-4 w-4" />
            <span className="flex-1">{text.notifications}</span>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
              className="scale-75"
            />
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onSignOut} className="gap-2 cursor-pointer">
            <LogOut className="h-4 w-4" />
            {text.signOut}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {text.deleteAccount}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{text.passwordTitle}</DialogTitle>
            <DialogDescription>{text.passwordDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{text.newPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{text.confirmPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {passwordErrors && (
              <p className="text-sm text-destructive">{passwordErrors}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              {language === 'sk' ? 'Zrušiť' : 'Cancel'}
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {text.passwordSaving}
                </>
              ) : (
                text.passwordSave
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{text.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{text.deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{text.deleteCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {text.deleting}
                </>
              ) : (
                text.deleteConfirm
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SettingsMenu;
