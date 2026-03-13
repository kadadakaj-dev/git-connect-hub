import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClientProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  preferred_language: string;
  total_visits: number;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export function useClientProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['client-profile', userId],
    queryFn: async (): Promise<ClientProfile | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching client profile:', error);
        throw error;
      }

      return data;
    },
    enabled: !!userId,
  });
}

export function useUpdateClientProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<ClientProfile>;
    }) => {
      const { data, error } = await supabase
        .from('client_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-profile', data.user_id] });
    },
  });
}
