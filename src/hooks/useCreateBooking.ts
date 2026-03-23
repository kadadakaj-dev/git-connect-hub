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

type FunctionInvokeError = {
  message?: string;
  context?: Response;
};

async function getFunctionErrorMessage(error: FunctionInvokeError | null | undefined): Promise<string> {
  if (!error) {
    return 'Failed to create booking';
  }

  if (error.context instanceof Response) {
    let payload: unknown;

    try {
      payload = await error.context.clone().json();
    } catch {
      payload = null;
    }

    if (payload && typeof payload === 'object') {
      const apiError = 'error' in payload && typeof payload.error === 'string' ? payload.error : null;
      const apiMessage = 'message' in payload && typeof payload.message === 'string' ? payload.message : null;

      if (apiError) {
        return apiError;
      }

      if (apiMessage) {
        return apiMessage;
      }
    }

    if (error.context.status === 429) {
      return 'Too many requests, please try again later';
    }
  }

  return error.message || 'Failed to create booking';
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

        throw new Error(await getFunctionErrorMessage(response.error));
      }

      const result = response.data as BookingResponse;

      if (!result.success && result.error) {
        throw new Error(result.error);
      }

      return result;
    },
  });
}