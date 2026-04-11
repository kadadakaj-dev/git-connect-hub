import { test, expect } from '@playwright/test';

const MOCK_TOKEN = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const MOCK_BOOKING = {
  date: '2026-04-20',
  time_slot: '10:00',
  client_name: 'Ján Novák',
  client_email: 'jan.novak@test.sk',
  service_name_sk: 'Chiropraktika',
  service_name_en: 'Chiropractic',
};

function setupPageInit(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('fyzio_splash_shown', 'true');
    window.localStorage.setItem('cookie-consent', 'accepted');
  });
}

// ─── Happy path ────────────────────────────────────────────────────────────────

test.describe('Customer cancellation — happy path', () => {
  test('shows confirmation screen and cancels booking successfully', async ({ page }) => {
    await setupPageInit(page);

    // Mock get-booking-by-token → returns valid pending booking
    await page.route('**/functions/v1/get-booking-by-token', async route => {
      await route.fulfill({
        status: 200,
        json: { success: true, booking: MOCK_BOOKING },
      });
    });

    // Intercept cancel-booking to capture payload and return success
    let capturedBody: Record<string, unknown> | null = null;
    await page.route('**/functions/v1/cancel-booking', async route => {
      capturedBody = await route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          booking: { ...MOCK_BOOKING, status: 'cancelled' },
        },
      });
    });

    await page.goto(`/cancel?token=${MOCK_TOKEN}`);

    // ── Step 1: confirm screen ──────────────────────────────────────────────
    await expect(
      page.getByText(/Chcete zrušiť túto rezerváciu|Do you want to cancel/i)
    ).toBeVisible({ timeout: 8000 });

    // Booking details should be visible
    await expect(page.getByText('Ján Novák')).toBeVisible();
    await expect(page.getByText(/Chiropraktika|Chiropractic/i)).toBeVisible();

    // ── Step 2: click cancel ────────────────────────────────────────────────
    await page.getByRole('button', { name: /Áno, zrušiť|Yes, cancel/i }).click();

    // ── Step 3: success screen ──────────────────────────────────────────────
    await expect(
      page.getByText(/Rezervácia zrušená|Booking Cancelled/i)
    ).toBeVisible({ timeout: 8000 });

    await expect(
      page.getByText(/úspešne zrušená|successfully cancelled/i)
    ).toBeVisible();

    // ── Step 4: verify cancel-booking was called with the correct token ─────
    expect(capturedBody).not.toBeNull();
    expect(capturedBody?.token).toBe(MOCK_TOKEN);
  });

  test('cancel-booking request contains the correct token from URL', async ({ page }) => {
    await setupPageInit(page);

    const customToken = 'f0e1d2c3-b4a5-6789-fedc-ba0987654321';
    let receivedToken: string | undefined;

    await page.route('**/functions/v1/get-booking-by-token', async route => {
      await route.fulfill({ status: 200, json: { success: true, booking: MOCK_BOOKING } });
    });

    await page.route('**/functions/v1/cancel-booking', async route => {
      const body = await route.request().postDataJSON();
      receivedToken = body?.token;
      await route.fulfill({
        status: 200,
        json: { success: true, booking: { ...MOCK_BOOKING, status: 'cancelled' } },
      });
    });

    await page.goto(`/cancel?token=${customToken}`);
    await page.getByRole('button', { name: /Áno, zrušiť|Yes, cancel/i }).click();

    await expect(page.getByText(/Rezervácia zrušená|Booking Cancelled/i)).toBeVisible({ timeout: 8000 });
    expect(receivedToken).toBe(customToken);
  });
});

// ─── Error scenarios ───────────────────────────────────────────────────────────

test.describe('Customer cancellation — error scenarios', () => {
  test('shows error when no token in URL', async ({ page }) => {
    await setupPageInit(page);
    await page.goto('/cancel');

    await expect(
      page.getByText(/Neplatný odkaz|Invalid cancellation link/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows error when token is not found in DB', async ({ page }) => {
    await setupPageInit(page);

    await page.route('**/functions/v1/get-booking-by-token', async route => {
      await route.fulfill({ status: 404, json: { error: 'Booking not found' } });
    });

    await page.goto(`/cancel?token=${MOCK_TOKEN}`);

    await expect(
      page.getByText(/Rezervácia nebola nájdená|Booking not found/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows already-cancelled state when booking was cancelled before', async ({ page }) => {
    await setupPageInit(page);

    await page.route('**/functions/v1/get-booking-by-token', async route => {
      await route.fulfill({
        status: 200,
        json: { success: false, error: 'Booking is already cancelled', booking: MOCK_BOOKING },
      });
    });

    await page.goto(`/cancel?token=${MOCK_TOKEN}`);

    await expect(
      page.getByText(/Rezervácia už bola zrušená|Booking Already Cancelled/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows too-late-to-cancel message when within 10h window', async ({ page }) => {
    await setupPageInit(page);

    await page.route('**/functions/v1/get-booking-by-token', async route => {
      await route.fulfill({ status: 200, json: { success: true, booking: MOCK_BOOKING } });
    });

    await page.route('**/functions/v1/cancel-booking', async route => {
      await route.fulfill({
        status: 400,
        json: {
          error: 'TOO_LATE_TO_CANCEL',
          message: 'Menej ako 10 hodín pred termínom...',
        },
      });
    });

    await page.goto(`/cancel?token=${MOCK_TOKEN}`);
    await page.getByRole('button', { name: /Áno, zrušiť|Yes, cancel/i }).click();

    await expect(
      page.getByText(/Zrušenie online nie je možné|Online cancellation not available/i)
    ).toBeVisible({ timeout: 8000 });

    // Phone number must be visible for manual cancellation
    await expect(page.getByText(/\+421 905 307 198/)).toBeVisible();
  });
});

// ─── Email payload verification ────────────────────────────────────────────────

test.describe('Cancellation email — payload verification', () => {
  test('cancel-booking receives correct booking token (email sent server-side)', async ({ page }) => {
    await setupPageInit(page);

    // Note: send-booking-email is called SERVER-SIDE inside the cancel-booking edge function.
    // From the browser we can only verify that cancel-booking was called correctly.
    // The edge function is responsible for triggering both client + admin emails.

    const emailRequests: Array<Record<string, unknown>> = [];

    await page.route('**/functions/v1/get-booking-by-token', async route => {
      await route.fulfill({ status: 200, json: { success: true, booking: MOCK_BOOKING } });
    });

    await page.route('**/functions/v1/cancel-booking', async route => {
      const body = await route.request().postDataJSON();
      emailRequests.push(body);
      await route.fulfill({
        status: 200,
        json: { success: true, booking: { ...MOCK_BOOKING, status: 'cancelled' } },
      });
    });

    await page.goto(`/cancel?token=${MOCK_TOKEN}`);
    await page.getByRole('button', { name: /Áno, zrušiť|Yes, cancel/i }).click();
    await expect(page.getByText(/Rezervácia zrušená|Booking Cancelled/i)).toBeVisible({ timeout: 8000 });

    // Exactly one cancel-booking call should have been made
    expect(emailRequests).toHaveLength(1);
    expect(emailRequests[0].token).toBe(MOCK_TOKEN);

    // The edge function internally sends:
    //   • cancellation-client → booking.client_email
    //   • cancellation-admin  → booking@fyzioafit.sk
    // Both are fire-and-forget from cancel-booking/index.ts lines 126-169.
  });

  test('keep-booking button does NOT call cancel-booking', async ({ page }) => {
    await setupPageInit(page);

    let cancelCalled = false;

    await page.route('**/functions/v1/get-booking-by-token', async route => {
      await route.fulfill({ status: 200, json: { success: true, booking: MOCK_BOOKING } });
    });

    await page.route('**/functions/v1/cancel-booking', async route => {
      cancelCalled = true;
      await route.continue();
    });

    await page.goto(`/cancel?token=${MOCK_TOKEN}`);
    await expect(page.getByRole('button', { name: /Nie, ponechať|No, keep/i })).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /Nie, ponechať|No, keep/i }).click();

    // Should navigate away without calling cancel
    await page.waitForURL(url => !url.pathname.includes('/cancel'), { timeout: 5000 });
    expect(cancelCalled).toBe(false);
  });
});
