import { test, expect, type Page } from '@playwright/test';
import { mockBookingResources, performBookingFlow } from './helpers/booking-fixtures';
import { cleanupTestBookings } from './helpers/cleanup';

test.describe('Booking Wizard Regression', () => {
    test.beforeEach(async ({ page }) => {
        // Skip splash screen and cookie banner AND mock stable Date (Monday, April 6, 2026)
        await mockBookingResources(page);
        await page.goto('/');
        // Wait for React hydration and CSS transition to be done
        await page.waitForSelector('[data-hydrated="true"]', { state: 'attached' });
        await expect(page.locator('[data-hydrated="true"]')).toBeVisible();
    });

    test.afterEach(async ({ page }) => {
        // No-op for specific email as we'll use unique ones
    });

    test('should progress through the valid booking path end-to-end', async ({ page }) => {
        const uniqueEmail = `regression-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
        
        // 1. Select Service
        const service = page.locator('[data-testid^="service-"]').first();
        await expect(service).toBeVisible();
        await service.click();

        // 2. Select Date (Pick Wednesday, April 8 2026 - well beyond 36h lead time from April 6)
        const targetDate = '2026-04-08';
        const daySelector = page.locator(`[data-testid="calendar-day-${targetDate}"]`);
        await expect(daySelector).toBeVisible();
        await daySelector.click();

        // 3. Select Time
        const timeSlots = page.locator('[data-testid^="time-slot-"]');
        await expect(timeSlots.first()).toBeVisible({ timeout: 10000 });
        await timeSlots.first().click();

        // 4. Fill Details
        await page.fill('[data-testid="input-clientName"]', 'Regression User');
        await page.fill('[data-testid="input-clientEmail"]', uniqueEmail);
        await page.fill('[data-testid="input-clientPhone"]', '+421900111222');

        // 5. Submit
        const submitBtn = page.locator('[data-testid="submit-booking"]');
        await expect(submitBtn).toBeEnabled();
        await submitBtn.click();

        // 6. Verify Success
        await expect(page.getByText(/Rezervácia úspešná/i).or(page.getByText(/Booking successful/i))).toBeVisible({ timeout: 15000 });
        await expect(page.locator('[data-testid="confirmation-details"]')).toBeVisible();
        
        // Cleanup after success
        await cleanupTestBookings(uniqueEmail);
    });

    test('should handle service switching correctly', async ({ page }) => {
        // Mock two services
        await page.route('**/rest/v1/services*', async route => {
            await route.fulfill({
                json: [
                    { id: 's1', name_sk: 'Service 1', price: 10, duration: 30, is_active: true, category: 'physiotherapy', icon: 'Activity' },
                    { id: 's2', name_sk: 'Service 2', price: 20, duration: 60, is_active: true, category: 'physiotherapy', icon: 'Activity' }
                ]
            });
        });

        await page.reload();
        await page.waitForSelector('[data-hydrated="true"]');

        // Select first service
        const s1 = page.locator('[data-testid="service-s1"]');
        await s1.click();
        await expect(s1).toHaveAttribute('aria-pressed', 'true');

        // Switch to second service
        const s2 = page.locator('[data-testid="service-s2"]');
        await s2.click();
        
        // Verify selection change via ARIA which is more stable than CSS
        await expect(s2).toHaveAttribute('aria-pressed', 'true');
        await expect(s1).toHaveAttribute('aria-pressed', 'false');
        
        // Ensure date selection is still possible
        const day = page.locator('[data-testid="calendar-day-2026-04-08"]');
        await day.click();
        await expect(page.locator('[data-testid^="time-slot-"]').first()).toBeVisible();
    });

    test('should maintain state persistence during service switching', async ({ page }) => {
        const uniqueEmail = `persist-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;

        // Partially fill the form
        await page.locator('[data-testid^="service-"]').first().click();
        await page.locator('[data-testid="calendar-day-2026-04-08"]').click();
        
        const timeSlot = page.locator('[data-testid^="time-slot-"]').first();
        await expect(timeSlot).toBeVisible();
        await timeSlot.click();

        const emailInput = page.locator('[data-testid="input-clientEmail"]');
        await emailInput.fill(uniqueEmail);
        await expect(emailInput).toHaveValue(uniqueEmail);
        
        // Change service - should preserve email
        const listItems = page.locator('[data-testid^="service-"]');
        await listItems.nth(1).click();
        
        // expect() auto-retries for 5s
        await expect(emailInput).toHaveValue(uniqueEmail);
    });

    test('should hide occupied slots', async ({ page }) => {
        const occupiedTime = '09:00';
        const targetDate = '2026-04-08';

        // Mock slot as occupied
        await page.route('**/rest/v1/rpc/get_booking_slot_counts*', async route => {
            await route.fulfill({
                json: [{ time_slot: occupiedTime, booking_duration: 30 }]
            });
        });

        await page.locator('[data-testid^="service-"]').first().click();
        
        // Ensure calendar is visible and click date
        const day = page.locator(`[data-testid="calendar-day-${targetDate}"]`);
        await expect(day).toBeVisible();
        await day.click();

        // In this app, occupied slots have 'bookedCount > 0' and available is false
        const slot = page.locator(`[data-testid="time-slot-${occupiedTime}"]`);
        await expect(slot).toBeVisible();
        await expect(slot).toBeDisabled();
    });

    test('should strictly enforce 36h lead time rule', async ({ page }) => {
        // Current mocked time: Monday, April 6, 2026, 12:00 Bratislava
        // 36h from then is Wednesday, April 8, 00:00
        
        await page.locator('[data-testid^="service-"]').first().click();

        // Tuesday, April 7 - should be ENTIRELY disabled (less than 36h from now)
        const tooSoonDate = '2026-04-07';
        const soonDay = page.locator(`[data-testid="calendar-day-${tooSoonDate}"]`);
        await expect(soonDay).toBeVisible();
        
        // Check if the day button itself is disabled
        await expect(soonDay).toBeDisabled();
        
        // Wednesday, April 8 - should be available (exactly 36h+)
        const okayDate = '2026-04-08';
        const okayDay = page.locator(`[data-testid="calendar-day-${okayDate}"]`);
        await okayDay.click();
        
        // Expect at least one slot to be enabled (slots start at 09:00, which is well past the 00:00 cutoff)
        await expect(page.locator('[data-testid^="time-slot-"]').first()).toBeEnabled();
    });
});
