import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  full_name: string;
  position: string;
  bio_sk: string | null;
  bio_en: string | null;
  avatar_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees-public'],
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from('employees_public')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}
