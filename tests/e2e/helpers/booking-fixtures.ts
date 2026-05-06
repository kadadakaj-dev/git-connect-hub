import { type Page, expect } from '@playwright/test';

/**
 * Automates the client booking flow.
 * Steps: Service -> Date (loop to find available) -> Time -> Personal Details -> Confirm.
 */
export async function performBookingFlow(
    page: Page, 
    { serviceId, date, time }: { serviceId?: string, date?: string, time?: string }
) {
    // Step 1: Select Service
    const serviceSelector = serviceId ? `[data-testid="service-${serviceId}"]` : '[data-testid^="service-"]';
    const serviceButton = page.locator(serviceSelector).first();
    await expect(serviceButton).toBeVisible({ timeout: 15000 });
    await serviceButton.click();

    // Wait for calendar to appear
    await expect(page.locator('[data-testid^="calendar-day-"]').first()).toBeVisible({ timeout: 10000 });

    // Step 2: Select Date
    const activeDays = page.locator('[data-testid^="calendar-day-"]:not([disabled])');
    if (date) {
        const targetDay = page.locator(`[data-testid="calendar-day-${date}"]`);
        await expect(targetDay).toBeVisible({ timeout: 15000 });
        await targetDay.click();
    } else {
        await expect(activeDays.first()).toBeVisible({ timeout: 15000 });
        const numDays = await activeDays.count();
        let found = false;
        
        for (let i = 0; i < Math.min(numDays, 10); i++) {
            await activeDays.nth(i).click();
            
            // Re-identify time slots after each click to handle re-renders
            const timeSlots = page.locator('[data-testid^="time-slot-"]:not([disabled])');
            try {
                // Wait longer for slots to appear (handling loading state implicitly or explicitly)
                await expect(timeSlots.first()).toBeVisible({ timeout: 8000 });
                found = true;
                break;
            } catch (e) {
                // Try next day if no slots appear in 8s
            }
        }
        if (!found) throw new Error('Could not find an available day with time slots in the first 10 days.');
    }

    // Step 3: Select Time Slot
    const timeSelector = time ? `[data-testid="time-slot-${time}"]` : '[data-testid^="time-slot-"]:not([disabled])';
    const slot = page.locator(timeSelector).first();
    await expect(slot).toBeVisible({ timeout: 10000 });
    const timeValue = await slot.getAttribute('data-testid');
    await slot.click();

    // Step 4: Fill Personal Details
    await expect(page.locator('[data-testid="input-clientName"]')).toBeVisible({ timeout: 10000 });
    await page.fill('[data-testid="input-clientName"]', 'Test User');
    await page.fill('[data-testid="input-clientEmail"]', 'test@example.com');
    await page.locator('[data-testid^="input-clientPhone"]').first().fill('+421900123456');
    await page.fill('[data-testid="input-notes"]', 'Automated test booking');

    // Step 5: Submit
    const submitButton = page.locator('[data-testid="submit-booking"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await submitButton.click();
    
    return { timeSlot: timeValue?.replace('time-slot-', '') };
}

/**
 * Mock necessary Supabase calls to ensure the booking wizard works consistently.
 */
export async function mockBookingResources(page: Page) {
    // 1. Disable Service Worker to prevent caching/intercepting issues in E2E
    await page.context().addInitScript(() => {
        // @ts-expect-error - overriding global serviceWorker
        delete window.navigator.serviceWorker;
        // @ts-expect-error - overriding global serviceWorker
        window.navigator.serviceWorker = {
            register: () => new Promise(() => {}),
            getRegistration: () => Promise.resolve(undefined),
            getRegistrations: () => Promise.resolve([]),
            addEventListener: () => {},
            removeEventListener: () => {},
        };
    });

    // 2. Exhaustive Date Mocking (Construction, now, and Intl)
    const fixedTime = new Date('2026-04-06T10:00:00Z').getTime(); // Monday morning
    await page.addInitScript((time: number) => {
        const mockDate = new Date(time);
        const OriginalDate = window.Date;
        
        // @ts-expect-error - overriding global Date
        window.Date = class extends OriginalDate {
            constructor(...args: (string | number | Date)[]) {
                if (args.length > 0) {
                    // @ts-expect-error - Date constructor spread
                    super(...args);
                } else {
                    super(mockDate.getTime());
                }
            }
            static now() { return mockDate.getTime(); }
        };

        // Also mock Intl.DateTimeFormat to use the fixed date's "now" implicitly
        const OriginalDateTimeFormat = window.Intl.DateTimeFormat;
        // @ts-expect-error - overriding global Intl
        window.Intl.DateTimeFormat = class extends OriginalDateTimeFormat {
            constructor(locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
                super(locales, options);
            }
            format(date?: Date | number) {
                return super.format(date || mockDate);
            }
            formatToParts(date?: Date | number) {
                return super.formatToParts(date || mockDate);
            }
        };

        // Bypass splash screen
        window.sessionStorage.setItem('fyzio_splash_shown', 'true');
        window.localStorage.setItem('cookie-consent', 'accepted');
        // @ts-expect-error - signaling the test environment
        window.playwright = true;
    }, fixedTime);

    // 4. Setup common API mocks
    await page.route('**/rest/v1/services*', async route => {
        await route.fulfill({ 
            json: [{ 
                id: 'mock-service', 
                name_sk: 'Mock Service SK', 
                name_en: 'Mock Service EN', 
                description_sk: 'Popis SK',
                description_en: 'Description EN',
                price: 35, 
                duration: 30, 
                category: 'physiotherapy', 
                icon: 'Activity',
                is_active: true 
            }] 
        });
    });

    await page.route('**/rest/v1/time_slots_config*', async route => {
        const configs = [];
        for (let i = 0; i <= 6; i++) {
            configs.push({ id: `m-${i}`, day_of_week: i, start_time: '09:00', end_time: '17:00', is_active: true });
        }
        await route.fulfill({ json: configs });
    });

    await page.route('**/rest/v1/employees_public*', async route => {
        await route.fulfill({ 
            json: [{ id: 'mock-emp', is_active: true, full_name: 'Mock Employee' }] 
        });
    });

    await page.route('**/rest/v1/blocked_dates*', async route => {
        await route.fulfill({ json: [] });
    });

    await page.route('**/rest/v1/rpc/get_booking_slot_counts*', async route => {
        await route.fulfill({ json: [] });
    });

    await page.route('**/rest/v1/bookings*', async route => {
        if (route.request().method() === 'GET') {
            await route.fulfill({ json: [] });
        } else {
            await route.fulfill({
                status: 201,
                json: [{
                    id: 'mock-booking-id',
                    date: '2026-04-08',
                    time_slot: '10:00',
                    client_name: 'Test User',
                    client_email: 'test@example.com',
                    status: 'confirmed',
                    booking_duration: 30,
                }],
            });
        }
    });

    await page.route('**/rest/v1/blocked_slots*', async route => {
        if (route.request().method() === 'GET') {
            await route.fulfill({ json: [] });
        } else {
            await route.fulfill({
                status: 201,
                json: [{
                    id: 'mock-block-id',
                    date: '2026-04-08',
                    time_slot: '10:00',
                    duration: 30,
                    therapist_id: null,
                    reason: 'Blokovaný čas',
                }],
            });
        }
    });

    await page.route('**/functions/v1/create-booking', async route => {
        await route.fulfill({ 
            json: { 
                success: true, 
                booking: { id: 'mock-booking-id', date: '2026-04-08', time_slot: '10:00', status: 'confirmed' } 
            } 
        });
    });

    await page.route('**/functions/v1/send-booking-email', async route => {
        await route.fulfill({ json: { success: true } });
    });
}
