import { test, expect } from '@playwright/test';
import { mockBookingResources } from './helpers/booking-fixtures';
import { cleanupTestBookings } from './helpers/cleanup';

test.describe('Occupied Slot Visibility', () => {
    test.beforeEach(async ({ page }) => {
        await mockBookingResources(page);
    });

    test.afterAll(async () => {
        await cleanupTestBookings();
    });

    test('should disable a slot that is fully occupied', async ({ page }) => {
        const bookedDate = '2026-04-08';
        const bookedTime = '09:00';

        // Override the slot-count mock BEFORE the first navigation so the slot
        // appears disabled from the very start.  This avoids a two-pass round-trip
        // and matches the format the app actually reads ({ time_slot, booking_duration }).
        await page.route('**/rest/v1/rpc/get_booking_slot_counts*', async route => {
            await route.fulfill({
                json: [{ time_slot: bookedTime, booking_duration: 30 }],
            });
        });

        await page.goto('/');
        await page.locator('[data-testid^="service-"]').first().click();

        const targetDay = page.locator(`[data-testid="calendar-day-${bookedDate}"]`);
        await expect(targetDay).toBeVisible({ timeout: 10000 });
        await targetDay.click();

        // The slot should be disabled because the count mock returns it as fully booked
        const bookedSlot = page.locator(`[data-testid="time-slot-${bookedTime}"]`);
        await expect(bookedSlot).toBeVisible({ timeout: 10000 });
        await expect(bookedSlot).toBeDisabled({ timeout: 10000 });
    });
});
