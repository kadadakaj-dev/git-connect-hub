import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';

interface TherapistNote {
  id: string;
  note: string;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface ClientBooking {
  id: string;
  date: string;
  time_slot: string;
  status: string;
  notes: string | null;
  created_at: string;
  service: Service | null;
  therapist_notes: TherapistNote[];
}

export function useClientBookings(userId: string | undefined) {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['client-bookings', userId, language],
    queryFn: async (): Promise<ClientBooking[]> => {
      if (!userId) return [];

      // First get bookings for this user
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          date,
          time_slot,
          status,
          notes,
          created_at,
          service_id
        `)
        .eq('client_user_id', userId)
        .order('date', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      if (!bookings || bookings.length === 0) return [];

      // Get unique service IDs
      const serviceIds = [...new Set(bookings.map((b) => b.service_id))];

      // Fetch services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name_sk, name_en, duration, price')
        .in('id', serviceIds);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      }

      // Fetch therapist notes for all bookings
      const bookingIds = bookings.map((b) => b.id);
      const { data: notes, error: notesError } = await supabase
        .from('therapist_notes')
        .select('id, booking_id, note, created_at')
        .in('booking_id', bookingIds);

      if (notesError) {
        console.error('Error fetching notes:', notesError);
      }

      // Map services by ID
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

      // Group notes by booking ID
      const notesMap = new Map<string, TherapistNote[]>();
      notes?.forEach((note) => {
        const existing = notesMap.get(note.booking_id) || [];
        existing.push({
          id: note.id,
          note: note.note,
          created_at: note.created_at,
        });
        notesMap.set(note.booking_id, existing);
      });

      // Combine data
      return bookings.map((booking) => ({
        id: booking.id,
        date: booking.date,
        time_slot: booking.time_slot,
        status: booking.status,
        notes: booking.notes,
        created_at: booking.created_at,
        service: servicesMap.get(booking.service_id) || null,
        therapist_notes: notesMap.get(booking.id) || [],
      }));
    },
    enabled: !!userId,
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('client_email, client_name, date, time_slot, cancellation_token, services(name_sk, name_en)')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      if (booking?.client_email) {
        const svc = booking.services as { name_sk: string; name_en: string } | null;
        supabase.functions.invoke('send-booking-email', {
          body: {
            to: booking.client_email,
            clientName: booking.client_name,
            serviceName: (language === 'sk' ? svc?.name_sk : svc?.name_en) || svc?.name_sk || 'Služba',
            date: booking.date,
            time: booking.time_slot,
            cancellationToken: booking.cancellation_token || '',
            language: language === 'sk' ? 'sk' : 'en',
            template: 'cancellation-client',
          }
        }).catch((err: unknown) => console.error('Failed to send cancellation email:', err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
    },
  });
}
