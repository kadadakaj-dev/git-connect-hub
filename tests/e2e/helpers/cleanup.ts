import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

/**
 * Cleans up booking data from the database for a specific test user.
 */
export async function cleanupTestBookings(clientEmail: string = 'test@example.com') {
    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('client_email', clientEmail);

    if (error) {
        console.error('Error cleaning up test bookings:', error);
    }
}
