import { type Page } from '@playwright/test';

// The hardcoded admin email checked by AdminProtectedRoute / Admin page.
// Must match src/lib/constants.ts ADMIN_EMAIL.
const ADMIN_EMAIL = 'booking@fyzioafit.sk';

// Project reference read from src/main.tsx — determines the localStorage key
// where supabase-js v2 stores the auth session.
const SUPABASE_PROJECT_REF = 'gtefgucwbskgknsdirvj';

// A fake JWT that supabase-js v2 can decode (it only base64url-decodes the
// payload — it never verifies the signature client-side).
// Payload: { aud, exp (far future), sub, email: ADMIN_EMAIL, role, iat }
const FAKE_ACCESS_TOKEN = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    'eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjo5OTk5OTk5OTk5LCJzdWIiOiJtb2NrLWFkbWluLWlkIiwiZW1haWwiOiJib29raW5nQGZ5emlvYWZpdC5zayIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxMDAwMDAwMDAwfQ',
    'fakesig',
].join('.');

const MOCK_ADMIN_USER = {
    id: 'mock-admin-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: ADMIN_EMAIL,
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
};

const MOCK_SESSION = {
    access_token: FAKE_ACCESS_TOKEN,
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: 9999999999,
    refresh_token: 'mock-refresh-token',
    user: MOCK_ADMIN_USER,
};

/**
 * Bypasses the real Supabase login form by injecting a fake admin session
 * directly into localStorage before the app loads.
 *
 * This works without real Supabase credentials because:
 * 1. supabase-js v2 reads the session from localStorage on startup (no network
 *    call needed when the token is not expired).
 * 2. Any subsequent auth API calls (/auth/v1/user, /auth/v1/token) are mocked
 *    via page.route() to return the same fake user/session.
 * 3. AdminProtectedRoute only checks session.user.email === ADMIN_EMAIL, which
 *    our fake session satisfies.
 */
export async function loginAsAdmin(page: Page) {
    // Mock Supabase auth API calls so token refresh / getUser() succeed.
    await page.route('**/auth/v1/user*', async route => {
        await route.fulfill({ json: MOCK_ADMIN_USER });
    });
    await page.route('**/auth/v1/token*', async route => {
        await route.fulfill({ json: MOCK_SESSION });
    });

    // Seed the session into localStorage BEFORE the Supabase client initialises.
    // addInitScript runs at the very start of each page load.
    await page.addInitScript(
        (args: { storageKey: string; session: typeof MOCK_SESSION }) => {
            localStorage.setItem(args.storageKey, JSON.stringify(args.session));
            sessionStorage.setItem('fyzio_splash_shown', 'true');
            localStorage.setItem('cookie-consent', 'accepted');
        },
        { storageKey: `sb-${SUPABASE_PROJECT_REF}-auth-token`, session: MOCK_SESSION },
    );

    await page.goto('/admin');
    await page.waitForURL('**/admin');
}

/**
 * Blocks a specific time slot on a specific date from the admin calendar.
 */
export async function blockSlotAsAdmin(page: Page, dateStr: string, timeStr: string) {
    // Navigate to calendar
    await page.click('nav a:has-text("Kalendár"), nav button:has-text("Kalendár")');
    
    // Find the slot and click to open the block menu
    // This assumes the admin UI handles slots as clickable items
    const slotSelector = `[data-testid="admin-calendar-slot-${dateStr}-${timeStr}"]`;
    await page.click(slotSelector);
    
    // Perform block action in the modal
    await page.click('[data-testid="block-slot-button"]');
    await page.click('button:has-text("Potvrdiť"), button:has-text("Confirm")');
}
