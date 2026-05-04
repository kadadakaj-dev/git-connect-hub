import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

/**
 * Cleans up booking data from the database for a specific test user.
 *
 * The Supabase client is created lazily inside this function (not at module
 * load time) so that importing this helper in CI — where Supabase env vars
 * may be absent — does not crash the Playwright worker process.
 * If neither key env var is set the function logs a warning and returns early.
 */
export async function cleanupTestBookings(clientEmail: string = 'test@example.com') {
    const url = process.env.VITE_SUPABASE_URL;
    const key =
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
        console.warn('cleanupTestBookings: Supabase env vars not set – skipping cleanup');
        return;
    }

    const supabase = createClient(url, key);
    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('client_email', clientEmail);

    if (error) {
        console.error('Error cleaning up test bookings:', error);
    }
}
