import { type Page } from '@playwright/test';
import process from 'node:process';

/**
 * Automates the login process for the admin dashboard.
 * Requires TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD env vars.
 */
export async function loginAsAdmin(page: Page) {
    const email = process.env.VITE_TEST_ADMIN_EMAIL ?? 'admin@example.com';
    const password = process.env.VITE_TEST_ADMIN_PASSWORD ?? 'password123';

    // Skip splash screen and cookie banner
    await page.addInitScript(() => {
        globalThis.sessionStorage.setItem('fyzio_splash_shown', 'true');
        globalThis.localStorage.setItem('cookie-consent', 'accepted');
    });

    await page.goto('/auth');
    
    // Fill login form
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    
    await page.getByRole('button', {
        name: /Pokračovať|Prihlásiť sa|Prihlásiť|Sign In/i,
    }).click();

    // Wait for either portal or admin (portal is the default redirect)
    await page.waitForURL(url => url.pathname.includes('/portal') || url.pathname.includes('/admin'));
    
    // If we land on /portal (standard client redirect), navigate to /admin
    if (page.url().includes('/portal')) {
        await page.goto('/admin');
    }

    // Ensure we are on admin
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
