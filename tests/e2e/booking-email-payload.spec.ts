import { test, expect } from '@playwright/test';
import { performBookingFlow, mockBookingResources } from './helpers/booking-fixtures';

test.describe('Booking Email Payload Verification', () => {
    test.beforeEach(async ({ page }) => {
        await mockBookingResources(page);
    });

    test('should send the correct booking details in the RPC call', async ({ page }) => {
        // Intercept the Edge Function call
        const requestPromise = page.waitForRequest(request => 
            request.url().includes('/functions/v1/create-booking') && request.method() === 'POST'
        );

        await page.route('**/functions/v1/create-booking', async route => {
            await route.fulfill({
                status: 200,
                json: { success: true, booking: { id: 'mock-booking-id' } }
            });
        });

        await page.goto('/');

        // Perform booking using helper (it handles service/date/time selection)
        const result = await performBookingFlow(page, {});

        // Wait for the request to be triggered by the Submit click in performBookingFlow
        const request = await requestPromise;
        const captureRequest = request.postDataJSON();

        // Eval captured request using correct snake_case keys from useCreateBooking.ts
        expect(captureRequest).not.toBeNull();
        expect(captureRequest?.client_name).toBe('Test User');
        expect(captureRequest?.client_email).toBe('test@example.com');
        expect(captureRequest?.time_slot).toBe(result.timeSlot);
        expect(captureRequest?.client_request_id).toBeDefined();
    });
});
