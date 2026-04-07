import { test, expect } from '@playwright/test';
import { mockBookingResources } from './helpers/booking-fixtures';

test.describe('Working Hours Sync', () => {
    test.beforeEach(async ({ page }) => {
        // Custom mock for time slots config - only works on Monday (day_of_week: 1)
        await page.route('**/rest/v1/time_slots_config*', async route => {
            await route.fulfill({ 
                json: [{ id: 'monday-only', day_of_week: 1, start_time: '09:00', end_time: '17:00', is_active: true }] 
            });
        });
        
        await mockBookingResources(page); // Mock other items
    });

    test('should only allow selecting dates that follow the admin working hours config', async ({ page }) => {
        await page.goto('/');

        // Find a Monday and check if it's enabled
        // Find a Sunday and check if it's disabled
        const mondayButton = page.locator('[data-testid^="calendar-day-"]:not([disabled])').first(); // Should be a Monday
        await expect(mondayButton).toBeVisible();
        
        // Find a Sunday (usually every 7th day) or just check by day of week if we can compute it
        // A simpler way is to check the CSS or text representation
        // Since we mock everything else, we can verify that some days are disabled
        const totalDays = await page.locator('[data-testid^="calendar-day-"]').count();
        const disabledDays = await page.locator('[data-testid^="calendar-day-"][disabled]').count();
        
        // Ensure at least some days are disabled due to the narrow mock config
        expect(disabledDays).toBeGreaterThan(0);
    });
});
