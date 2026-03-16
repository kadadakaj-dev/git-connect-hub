import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { Camera, Loader2, User } from 'lucide-react';
import { z } from 'zod';
import AvatarEditDialog from './AvatarEditDialog';

interface ClientProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  preferred_language: string;
  total_visits: number;
}

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ClientProfile;
  onProfileUpdated: () => void;
}

const profileSchema = z.object({
  full_name: z.string().min(2, 'Meno musí mať aspoň 2 znaky'),
  phone: z.string().optional(),
});

const ProfileEditDialog = ({
  open,
  onOpenChange,
  profile,
  onProfileUpdated,
}: ProfileEditDialogProps) => {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name,
    phone: profile.phone || '',
  });
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const t = {
    sk: {
      title: 'Upraviť profil',
      subtitle: 'Aktualizujte svoje osobné údaje',
      fullName: 'Celé meno',
      phone: 'Telefónne číslo',
      avatar: 'Profilová fotka',
      changePhoto: 'Zmeniť fotku',
      save: 'Uložiť zmeny',
      cancel: 'Zrušiť',
      saving: 'Ukladám...',
      success: 'Profil bol aktualizovaný',
      error: 'Chyba pri aktualizácii profilu',
      uploadError: 'Chyba pri nahrávaní fotky',
      uploadSuccess: 'Fotka bola nahraná',
      fileTooLarge: 'Súbor je príliš veľký (max 5MB)',
      invalidFileType: 'Neplatný typ súboru (povolené: JPG, PNG, WebP)',
    },
    en: {
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      fullName: 'Full Name',
      phone: 'Phone Number',
      avatar: 'Profile Photo',
      changePhoto: 'Change Photo',
      save: 'Save Changes',
      cancel: 'Cancel',
      saving: 'Saving...',
      success: 'Profile updated successfully',
      error: 'Error updating profile',
      uploadError: 'Error uploading photo',
      uploadSuccess: 'Photo uploaded successfully',
      fileTooLarge: 'File too large (max 5MB)',
      invalidFileType: 'Invalid file type (allowed: JPG, PNG, WebP)',
    },
  };

  const text = t[language];

  const handleAvatarUpdated = () => {
    // Refresh profile to get new avatar_url
    onProfileUpdated();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(text.invalidFileType);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(text.fileTooLarge);
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(urlData.publicUrl);
      toast.success(text.uploadSuccess);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(text.uploadError);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = profileSchema.safeParse(formData);
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
      const { error } = await supabase
        .from('client_profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          avatar_url: avatarUrl,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast.success(text.success);
      onProfileUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(text.error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.subtitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={avatarUrl || undefined} alt={formData.full_name} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {formData.full_name ? getInitials(formData.full_name) : <User />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => setIsAvatarDialogOpen(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAvatarDialogOpen(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              {text.changePhoto}
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{text.fullName}</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={language === 'sk' ? 'Ján Novák' : 'John Doe'}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{text.phone}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+421 900 123 456"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {text.cancel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {text.saving}
                </>
              ) : (
                text.save
              )}
            </Button>
          </DialogFooter>
        </form>

        <AvatarEditDialog
          open={isAvatarDialogOpen}
          onOpenChange={setIsAvatarDialogOpen}
          currentAvatarUrl={avatarUrl}
          fullName={formData.full_name}
          userId={profile.user_id}
          onAvatarUpdated={handleAvatarUpdated}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;
