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
  queued?: boolean;
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

      // If offline, the SW BackgroundSync plugin will queue the request.
      // supabase-js wraps fetch failures as FunctionsHttpError / FunctionsFetchError.
      if (response.error) {
        // Network failure while offline → request was queued by SW
        if (!navigator.onLine) {
          return {
            success: true,
            queued: true,
          };
        }
        // Try to extract the real error message from the response body
        let errorMessage = response.error.message || 'Failed to create booking';
        try {
          const context = (response.error as any).context;
          if (context && typeof context.json === 'function') {
            const body = await context.json();
            if (body?.error) {
              errorMessage = (Array.isArray(body.details) && body.details.length > 0)
                ? body.details.join(', ')
                : body.error;
            }
          }
        } catch {
          // Ignore body-parsing errors — fall back to the generic message
        }
        throw new Error(errorMessage);
      }

      const result = response.data as BookingResponse;

      if (!result) {
        throw new Error('Unexpected empty response from booking service');
      }

      if (!result.success && result.error) {
        throw new Error(result.error);
      }

      return result;
    },
  });
}