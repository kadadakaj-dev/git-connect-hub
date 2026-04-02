import { expect, test, type Page } from '@playwright/test';

test.describe('Booking wizard smoke flow', () => {
    test.beforeEach(async ({ page }) => {
        // Skip splash screen and cookie banner
        await page.addInitScript(() => {
            window.sessionStorage.setItem('fyzio_splash_shown', 'true');
            window.localStorage.setItem('cookie-consent', 'accepted');
        });
        
        // Mock time slots config to always return a schedule 09:00 - 17:00 for any day
        await page.route('**/rest/v1/time_slots_config*', async route => {
            await route.fulfill({ 
                json: [{ id: 'mock', day_of_week: 1, start_time: '09:00', end_time: '17:00', is_active: true }] 
            });
        });
        
        // Mock active employees
        await page.route('**/rest/v1/employees_public*', async route => {
            await route.fulfill({ 
                json: [{ id: 'mock-emp', is_active: true, name: 'Mock Emp' }] 
            });
        });
        
        // Mock current bookings to empty (so slots are always available)
        await page.route('**/rest/v1/rpc/get_booking_slot_counts*', async route => {
            await route.fulfill({ json: [] });
        });
    });

    test('should progress through the booking wizard steps', async ({ page }) => {
        await page.goto('/');

        // Step 1: Select Service
        await expect(page.getByText(/Vyberte službu/i).or(page.getByText(/Select service/i))).toBeVisible();
        
        // Find a service button (they contain prices like "xx €")
        const serviceButton = page.locator('button').filter({ hasText: '€' }).first();
        await expect(serviceButton).toBeVisible();
        await serviceButton.click();

        // Step 2: Select Date (Calendar should be visible)
        // Try clicking days until we find one with time slots
        const activeDays = page.locator('.grid-cols-7 button:not([disabled])');
        await expect(activeDays.first()).toBeVisible();
        const numDays = await activeDays.count();
        let foundTime = false;
        
        for (let i = 0; i < Math.min(numDays, 15); i++) {
            await activeDays.nth(i).click();
            try {
                const timeSlot = page.locator('button:has-text(":"):not([disabled])').first();
                await expect(timeSlot).toBeVisible({ timeout: 1500 });
                await timeSlot.click();
                await page.waitForTimeout(500); // Wait for React state & Framer Motion to settle
                foundTime = true;
                break;
            } catch (e) {
                // Time slot not found, try next day
            }
        }
        expect(foundTime, 'Could not find any day with available time slots').toBeTruthy();

        // Step 4: Client Details
        const nameInput = page.locator('#clientName');
        await expect(nameInput).toBeVisible({ timeout: 10000 });
        
        // Fill details
        await nameInput.click({ force: true });
        await nameInput.fill('Playwright Test User');
        await page.locator('#clientEmail').fill('playwright@example.com');
        await page.locator('#clientPhone').fill('+421900111222');

        // Check if Submit button is enabled
        const submitButton = page.locator('button:has-text("Rezervovať"), button:has-text("Potvrdiť")').first();
        await expect(submitButton).toBeEnabled();
    });

    test('should show validation errors on the last step', async ({ page }) => {
        await page.goto('/');

        // Navigate to the last step (service -> date -> time)
        const serviceButton = page.locator('button').filter({ hasText: '€' }).first();
        await expect(serviceButton).toBeVisible();
        await serviceButton.click();
        // Try clicking days until we find one with time slots
        const activeDays = page.locator('.grid-cols-7 button:not([disabled])');
        await expect(activeDays.first()).toBeVisible();
        const numDays = await activeDays.count();
        let foundTime = false;
        
        for (let i = 0; i < Math.min(numDays, 15); i++) {
            await activeDays.nth(i).click();
            try {
                const timeSlot = page.locator('button:has-text(":"):not([disabled])').first();
                await expect(timeSlot).toBeVisible({ timeout: 1500 });
                await timeSlot.click();
                foundTime = true;
                break;
            } catch (e) {
                // Try next day
            }
        }
        expect(foundTime, 'Could not find any day with available time slots').toBeTruthy();

        // Click submit without filling anything
        const submitButton = page.locator('button:has-text("Rezervovať"), button:has-text("Potvrdiť")').first();
        await expect(submitButton).toBeVisible();
        await submitButton.click();

        // Expect validation errors (Slovak by default in mock or local)
        await expect(screenText(page, [/Meno je povinné/i, /Name is required/i])).toBeVisible();
        await expect(screenText(page, [/E-mail je povinný/i, /Email is required/i])).toBeVisible();
        await expect(screenText(page, [/Telefónne číslo je povinné/i, /Phone is required/i])).toBeVisible();
    });
});

/**
 * Helper to match text in multiple languages (Slovak or English)
 */
function screenText(page: Page, patterns: RegExp[]) {
    let loc = page.getByText(patterns[0]);
    for (let i = 1; i < patterns.length; i++) {
        loc = loc.or(page.getByText(patterns[i]));
    }
    return loc.first();
}
