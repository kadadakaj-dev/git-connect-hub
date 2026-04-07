import { type Page } from '@playwright/test';

/**
 * Automates the login process for the admin dashboard.
 * Requires TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD env vars.
 */
export async function loginAsAdmin(page: Page) {
    const email = process.env.VITE_TEST_ADMIN_EMAIL ?? 'admin@example.com';
    const password = process.env.VITE_TEST_ADMIN_PASSWORD ?? 'password123';

    // Skip splash screen and cookie banner
    await page.addInitScript(() => {
        window.sessionStorage.setItem('fyzio_splash_shown', 'true');
        window.localStorage.setItem('cookie-consent', 'accepted');
    });

    await page.goto('/admin/login');
    
    // Fill login form
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.locator('button:has-text("Prihlásiť"), button:has-text("Sign In")').click();

    // Verify redirect to dashboard
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
