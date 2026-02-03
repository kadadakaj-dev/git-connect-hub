import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BookingData {
  serviceId: string;
  date: Date;
  timeSlot: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes?: string;
}

interface BookingResponse {
  success: boolean;
  booking?: {
    id: string;
    date: string;
    time_slot: string;
    status: string;
  };
  error?: string;
  details?: string[];
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (data: BookingData): Promise<BookingResponse> => {
      const response = await supabase.functions.invoke('create-booking', {
        body: {
          service_id: data.serviceId,
          date: format(data.date, 'yyyy-MM-dd'),
          time_slot: data.timeSlot,
          client_name: data.clientName,
          client_email: data.clientEmail,
          client_phone: data.clientPhone,
          notes: data.notes || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create booking');
      }

      const result = response.data as BookingResponse;

      if (!result.success && result.error) {
        throw new Error(result.error);
      }

      return result;
    },
  });
}