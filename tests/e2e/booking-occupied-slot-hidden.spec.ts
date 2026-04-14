import { test, expect } from '@playwright/test';
import { mockBookingResources, performBookingFlow } from './helpers/booking-fixtures';
import { cleanupTestBookings } from './helpers/cleanup';

test.describe('Occupied Slot Visibility', () => {
    test.beforeEach(async ({ page }) => {
        await mockBookingResources(page);
    });

    test.afterAll(async () => {
        await cleanupTestBookings();
    });

    test('should hide a slot from the available list after it is booked', async ({ page }) => {
        const bookedDate = '2026-04-08';
        const bookedTime = '09:00';

        await page.goto('/');

        // Book a specific slot so we know exactly which one to check
        await performBookingFlow(page, { date: bookedDate, time: bookedTime });

        // Confirm success
        await expect(
            page.getByText(/Rezervácia potvrdená/i).or(page.getByText(/Booking Confirmed/i))
        ).toBeVisible({ timeout: 15000 });

        // Register the "occupied" mock BEFORE navigating back so it is active for
        // the next slot-count fetch. Playwright resolves routes last-registered-first,
        // so this overrides the empty-array mock set up in beforeEach.
        await page.route('**/rest/v1/rpc/get_booking_slot_counts*', async route => {
            await route.fulfill({
                json: [{ time: bookedTime, booked_count: 1, total_capacity: 1 }],
            });
        });

        // Navigate back and go through the booking wizard to the same date
        await page.goto('/');
        await page.locator('[data-testid^="service-"]').first().click();

        const targetDay = page.locator(`[data-testid="calendar-day-${bookedDate}"]`);
        await expect(targetDay).toBeVisible({ timeout: 10000 });
        await targetDay.click();

        // The slot should now be disabled because the count mock returns it as fully booked
        const bookedSlot = page.locator(`[data-testid="time-slot-${bookedTime}"]`);
        await expect(bookedSlot).toBeVisible({ timeout: 10000 });
        await expect(bookedSlot).toBeDisabled({ timeout: 10000 });
    });
});
