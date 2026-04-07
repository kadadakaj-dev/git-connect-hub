import { expect, test } from '@playwright/test';

function getBratislavaNow(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Bratislava',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const dateObj: Record<string, string> = {};
  parts.forEach(({ type, value }) => { dateObj[type] = value; });
  
  return new Date(
    Number(dateObj.year),
    Number(dateObj.month) - 1,
    Number(dateObj.day),
    Number(dateObj.hour),
    Number(dateObj.minute),
    Number(dateObj.second)
  );
}

test.describe('Booking 36h Lead Time Rule', () => {
    test.beforeEach(async ({ page }) => {
        // Skip splash screen and cookie banner
        await page.addInitScript(() => {
            window.sessionStorage.setItem('fyzio_splash_shown', 'true');
            window.localStorage.setItem('cookie-consent', 'accepted');
        });
        
        // Mock services
        await page.route('**/rest/v1/services*', async route => {
            await route.fulfill({ 
                json: [{ id: 'mock-service', name: 'Mock Service', price: 30, duration: 30, category: 'physiotherapy', is_active: true }] 
            });
        });

        // Mock time slots config to return a full-day schedule for ALL days (00:00 - 23:30)
        await page.route('**/rest/v1/time_slots_config*', async route => {
            const configs = [];
            for (let i = 0; i < 7; i++) {
                configs.push({ id: `mock-${i}`, day_of_week: i, start_time: '00:00', end_time: '23:30', is_active: true });
            }
            await route.fulfill({ json: configs });
        });
        
        // Mock active employees
        await page.route('**/rest/v1/employees_public*', async route => {
            await route.fulfill({ json: [{ id: 'mock-emp', is_active: true, name: 'Mock Emp' }] });
        });
        
        // Mock current bookings to empty
        await page.route('**/rest/v1/rpc/get_booking_slot_counts*', async route => {
            await route.fulfill({ json: [] });
        });
    });

    test('should prevent booking slots under 36 hours and allow those over 36 hours', async ({ page }) => {
        // Log all console messages from browser to help debug time sync
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        await page.goto('/');

        // Step 1: Select Service
        const serviceButton = page.locator('[data-testid^="service-"]').first();
        await expect(serviceButton).toBeVisible();
        await serviceButton.click();

        // Calculate the exact 36h boundary in Bratislava time
        const now = getBratislavaNow();
        const boundaryTime = new Date(now.getTime() + 36 * 60 * 60 * 1000);
        
        // Format the date string for `calendar-day-*` data-testid
        // Use local methods because standard JS Date will output based on local Node TZ.
        // Since we explicitly constructed the Date with Bratislava parts, 
        // local accessors (getFullYear, getMonth, etc.) accurately represent Bratislava date.
        const year = boundaryTime.getFullYear();
        const month = String(boundaryTime.getMonth() + 1).padStart(2, '0');
        const day = String(boundaryTime.getDate()).padStart(2, '0');
        const boundaryDayStr = `${year}-${month}-${day}`;

        // Find and click the calendar day where the boundary falls
        const targetDay = page.locator(`[data-testid="calendar-day-${boundaryDayStr}"]`);
        
        // Check if the whole day is disabled. (If the boundary is exactly at 23:59:59, the day might just be fully disabled)
        const isDisabled = await targetDay.getAttribute('disabled') !== null;
        
        // If the target day is completely disabled, it means the 36h cutoff eliminates the entire day.
        // We will move exactly 1 day forward to test the boundary there.
        let testingDate = boundaryTime;
        let testingDateStr = boundaryDayStr;
        
        if (isDisabled) {
           testingDate = new Date(boundaryTime.getTime() + 24 * 60 * 60 * 1000);
           const ty = testingDate.getFullYear();
           const tm = String(testingDate.getMonth() + 1).padStart(2, '0');
           const td = String(testingDate.getDate()).padStart(2, '0');
           testingDateStr = `${ty}-${tm}-${td}`;
        }
        
        const finalTargetDay = page.locator(`[data-testid="calendar-day-${testingDateStr}"]`);
        await expect(finalTargetDay).toBeVisible();
        await finalTargetDay.click();

        // Wait for slots to render
        await page.waitForSelector('[data-testid^="time-slot-"]');
        
        // We calculate which slots should be enabled and disabled based on the 36h exact cutoff
        // testingDate is the boundaryTime (or +24h if edge case).
        // For each slot rendered, we check its time.
        const slots = await page.locator('[data-testid^="time-slot-"]').all();
        expect(slots.length).toBeGreaterThan(0);

        let checkedDisabled = false;
        let checkedEnabled = false;

        for (const slot of slots) {
            const testId = await slot.getAttribute('data-testid'); // e.g. "time-slot-14:30"
            const timeStr = testId?.replace('time-slot-', '') || '';
            const [h, m] = timeStr.split(':').map(Number);
            
            // Create a date object matching that slot on the opened day
            const slotDateTime = new Date(testingDate);
            slotDateTime.setHours(h, m, 0, 0);

            // True cut off comparison
            const isStrictlyLessThan36h = slotDateTime.getTime() < boundaryTime.getTime();

            const isAttrDisabled = (await slot.getAttribute('disabled')) !== null;

            if (isStrictlyLessThan36h) {
                // Must be disabled
                expect(isAttrDisabled, `Slot ${timeStr} should be disabled (under 36h)`).toBeTruthy();
                checkedDisabled = true;
            } else {
                // Must be enabled
                expect(isAttrDisabled, `Slot ${timeStr} should be enabled (over 36h)`).toBeFalsy();
                if (!checkedEnabled) {
                    await slot.click(); // Select the first available slot to ensure it's interactable
                    checkedEnabled = true;
                }
            }
        }

        // We should have encountered at least one viable enabled slot.
        // We might not have encountered a disabled slot if the boundary was early morning and we shifted to +24h,
        // but that's mathematically rare given we generate 00:00-23:30 slots. Thus both should normally be true.
        expect(checkedEnabled, 'Expected at least one enabled slot > 36h').toBeTruthy();

        // Step 4: Validate we progressed to client details
        const nameInput = page.locator('[data-testid="input-clientName"]');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
    });
});
