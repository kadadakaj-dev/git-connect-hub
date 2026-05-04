import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

/**
 * Cleans up booking data from the database for a specific test user.
 * Safely no-ops when Supabase env vars are absent (e.g. CI without real secrets).
 * All E2E tests mock Supabase at the network layer, so cleanup is only needed when
 * running against a real backend.
 */
export async function cleanupTestBookings(clientEmail: string = 'test@example.com') {
    const url = process.env.VITE_SUPABASE_URL;
    // VITE_SUPABASE_ANON_KEY and VITE_SUPABASE_PUBLISHABLE_KEY are two names used
    // for the same anon/publishable key in this project (see .env.example).
    // VITE_SUPABASE_ANON_KEY takes precedence; VITE_SUPABASE_PUBLISHABLE_KEY is
    // accepted as an alias for environments that only set the publishable key name.
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const key = anonKey || publishableKey;

    if (!url || !key) {
        console.warn('[cleanup] Supabase env vars not set – skipping E2E database cleanup');
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
