import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';

interface FavoriteService {
  id: string;
  client_id: string;
  service_id: string;
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  } | null;
}

export function useFavoriteServices(clientId: string | undefined) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['favorite-services', clientId, language],
    queryFn: async (): Promise<FavoriteService[]> => {
      if (!clientId) return [];

      const { data: favorites, error: favError } = await supabase
        .from('favorite_services')
        .select('id, client_id, service_id')
        .eq('client_id', clientId);

      if (favError) {
        console.error('Error fetching favorites:', favError);
        throw favError;
      }

      if (!favorites || favorites.length === 0) return [];

      const serviceIds = favorites.map((f) => f.service_id);

      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name_sk, name_en, duration, price')
        .in('id', serviceIds);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      }

      const servicesMap = new Map(
        services?.map((s) => [
          s.id,
          {
            id: s.id,
            name: language === 'sk' ? s.name_sk : s.name_en,
            duration: s.duration,
            price: Number(s.price),
          },
        ])
      );

      return favorites.map((fav) => ({
        id: fav.id,
        client_id: fav.client_id,
        service_id: fav.service_id,
        service: servicesMap.get(fav.service_id) || null,
      }));
    },
    enabled: !!clientId,
  });

  const toggleMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      if (!clientId) throw new Error('No client ID');

      // Check if already favorited
      const { data: existing } = await supabase
        .from('favorite_services')
        .select('id')
        .eq('client_id', clientId)
        .eq('service_id', serviceId)
        .maybeSingle();

      if (existing) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_services')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_services')
          .insert({ client_id: clientId, service_id: serviceId });

        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['favorite-services', clientId] });
      toast.success(
        result.action === 'added'
          ? language === 'sk'
            ? 'Pridané medzi obľúbené'
            : 'Added to favorites'
          : language === 'sk'
          ? 'Odstránené z obľúbených'
          : 'Removed from favorites'
      );
    },
    onError: (error) => {
      console.error('Error toggling favorite:', error);
      toast.error(language === 'sk' ? 'Chyba pri aktualizácii' : 'Error updating favorites');
    },
  });

  return {
    ...query,
    toggleFavorite: toggleMutation.mutate,
  };
}
