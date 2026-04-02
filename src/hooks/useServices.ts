import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/booking';
import { useLanguage } from '@/i18n/LanguageContext';

export function useServices() {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['services', language],
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }

      return (data || []).map((service) => ({
        id: service.id,
        name: language === 'sk' ? service.name_sk : service.name_en,
        description: language === 'sk' ? service.description_sk : service.description_en,
        duration: service.duration,
        price: Number(service.price),
        category: service.category as 'physiotherapy' | 'chiropractic',
        icon: service.icon,
      }));
    },
  });
}