import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/admin-fixtures';
import { mockBookingResources } from './helpers/booking-fixtures';
import { cleanupTestBookings } from './helpers/cleanup';

test.describe('Admin Slot Blocking', () => {
    test.afterAll(async () => {
        await cleanupTestBookings();
    });

    test('should prevent client from booking a slot that was blocked by admin', async ({ page, browser }) => {
        // Use stable date mocks for consistency with the rest of the suite
        await mockBookingResources(page);

        // 1. Login as Admin
        await loginAsAdmin(page);

        // 2. Block a specific slot on our stable mocked date (Wednesday, April 8, 2026)
        const dateStr = '2026-04-08';
        const timeStr = '10:00';

        // Wait for admin dashboard to load
        await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });

        // Navigate to the Calendar tab where CalendarView (and the Block button) lives
        // Register the blocked_slots mock BEFORE clicking the tab, because CalendarView's
        // fetchData() fires immediately on render and the GET would otherwise slip through
        // to the placeholder Supabase URL.
        await page.route('**/rest/v1/blocked_slots*', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    json: [{ id: 'mock-block-id', date: dateStr, time_slot: timeStr, duration: 30 }],
                });
            } else {
                await route.fulfill({ json: [] });
            }
        });

        await page.getByRole('tab', { name: /Kalendár|Calendar/i }).click();

        // Click the "Block" button in CalendarHeader
        await page.getByRole('button', { name: /Blokovať|Block/i }).first().click();

        // Wait for the EventModal dialog to open
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

        // Verify blockScope is pre-selected to 'time_slot' (after our CalendarView fix)
        await expect(page.getByTestId('block-scope-time_slot')).toHaveClass(/bg-primary/, { timeout: 3000 });

        // Update date and time to our stable test values
        await page.locator('input[type="date"]').fill(dateStr);
        await page.locator('input[type="time"]').fill(timeStr);

        // Submit the block
        await page.getByRole('button', { name: /Uložiť|Save/i }).click();

        // Modal should close after save
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

        // 3. Open client booking page as a new user in a separate context
        const context2 = await browser.newContext();
        const clientPage = await context2.newPage();

        // Apply the same stable mocks to the client page
        await mockBookingResources(clientPage);

        // Mock get_booking_slot_counts to return the blocked slot
        // (simulates the bookings table having a block entry for this slot)
        await clientPage.route('**/rest/v1/rpc/get_booking_slot_counts*', async route => {
            await route.fulfill({
                json: [{ time_slot: timeStr, booking_duration: 30 }],
            });
        });

        await clientPage.goto('/');

        // 4. Navigate to the blocked date and verify the slot is disabled
        const serviceButton = clientPage.locator('[data-testid^="service-"]').first();
        await expect(serviceButton).toBeVisible({ timeout: 15000 });
        await serviceButton.click();

        const dateButton = clientPage.locator(`[data-testid="calendar-day-${dateStr}"]`);
        await expect(dateButton).toBeVisible({ timeout: 10000 });
        await dateButton.click();

        const blockedSlot = clientPage.locator(`[data-testid="time-slot-${timeStr}"]`);
        // Slot must be disabled — capacity is fully consumed by the block entry
        await expect(blockedSlot).toBeDisabled({ timeout: 10000 });

        await context2.close();
    });
});
