import { expect, test, type Page } from '@playwright/test';

const DATE_MONDAY = '2026-04-13'; // Monday, safely beyond the mocked "now" + 36h
const TIME_CONFIG = {
  id: 'cfg-mon',
  day_of_week: 1,
  start_time: '09:00',
  end_time: '18:00',
  is_active: true,
  created_at: '2026-04-01T10:00:00Z',
};

type ServiceDef = {
  id: string;
  name_sk: string;
  duration: number;
};

const SERVICE_15: ServiceDef = {
  id: 'svc-15',
  name_sk: 'Chiropraxia/Naprávanie',
  duration: 15,
};

const SERVICE_55: ServiceDef = {
  id: 'svc-55',
  name_sk: 'Chiro masáž',
  duration: 55,
};

async function setupBoundaryMocks(page: Page, services: ServiceDef[]) {
  await page.context().addInitScript(() => {
    // @ts-expect-error - test override
    delete window.navigator.serviceWorker;
    // @ts-expect-error - test override
    window.navigator.serviceWorker = {
      register: () => new Promise(() => {}),
      getRegistration: () => Promise.resolve(undefined),
      getRegistrations: () => Promise.resolve([]),
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  });

  const fixedTime = new Date('2026-04-06T10:00:00Z').getTime();
  await page.addInitScript((time: number) => {
    const mockDate = new Date(time);
    const OriginalDate = window.Date;
    // @ts-expect-error - test override
    window.Date = class extends OriginalDate {
      constructor(...args: (string | number | Date)[]) {
        if (args.length > 0) {
          // @ts-expect-error - Date constructor spread
          super(...args);
        } else {
          super(mockDate.getTime());
        }
      }
      static now() {
        return mockDate.getTime();
      }
    };

    window.sessionStorage.setItem('fyzio_splash_shown', 'true');
    window.localStorage.setItem('cookie-consent', 'accepted');
    // @ts-expect-error - E2E marker
    window.playwright = true;
  }, fixedTime);

  await page.route('**/rest/v1/services*', async (route) => {
    await route.fulfill({
      json: services.map((service) => ({
        id: service.id,
        name_sk: service.name_sk,
        name_en: service.name_sk,
        duration: service.duration,
        price: 50,
        category: 'chiro',
        is_active: true,
      })),
    });
  });

  await page.route('**/rest/v1/time_slots_config*', async (route) => {
    await route.fulfill({ json: [TIME_CONFIG] });
  });

  await page.route('**/rest/v1/blocked_dates*', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/rest/v1/rpc/get_booking_slot_counts*', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/rest/v1/employees_public*', async (route) => {
    await route.fulfill({ json: [{ id: 'emp-1', is_active: true, full_name: 'Test Emp' }] });
  });

  await page.route('**/functions/v1/create-booking', async (route) => {
    const body = route.request().postDataJSON() as { service_id: string; time_slot: string; date: string };
    const service = services.find((s) => s.id === body.service_id);

    if (!service) {
      await route.fulfill({ status: 400, json: { error: 'Service not found' } });
      return;
    }

    const [h, m] = body.time_slot.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const endMinutes = startMinutes + service.duration;
    const [closeH, closeM] = TIME_CONFIG.end_time.split(':').map(Number);
    const closingMinutes = closeH * 60 + closeM;

    if (endMinutes > closingMinutes) {
      const endHour = String(Math.floor(endMinutes / 60)).padStart(2, '0');
      const endMinute = String(endMinutes % 60).padStart(2, '0');
      await route.fulfill({
        status: 400,
        json: {
          error: `BUSINESS_RULE_VIOLATION: Booking must end by ${TIME_CONFIG.end_time}. Your session ends at ${endHour}:${endMinute}`,
        },
      });
      return;
    }

    await route.fulfill({
      status: 201,
      json: {
        success: true,
        booking: {
          id: 'booking-ok',
          date: body.date,
          time_slot: body.time_slot,
          status: 'confirmed',
        },
      },
    });
  });

  await page.route('**/functions/v1/send-booking-email', async (route) => {
    await route.fulfill({ status: 200, json: { success: true } });
  });
}

async function openWizardAndSelectServiceAndDate(page: Page, serviceId: string) {
  await page.goto('/');

  await page.locator(`[data-testid="service-${serviceId}"]`).click();

  const targetDay = page.locator(`[data-testid="calendar-day-${DATE_MONDAY}"]`);
  await expect(targetDay).toBeVisible();
  await targetDay.click();
}

test.describe('Booking duration boundary E2E', () => {
  test('15-min service at 17:30 is allowed when closing is 18:00', async ({ page }) => {
    await setupBoundaryMocks(page, [SERVICE_15]);
    await openWizardAndSelectServiceAndDate(page, SERVICE_15.id);

    const slot1730 = page.locator('[data-testid="time-slot-17:30"]');
    const slot1800 = page.locator('[data-testid="time-slot-18:00"]');

    await expect(slot1730).toBeVisible();
    await expect(slot1730).toBeEnabled();
    await expect(slot1800).toHaveCount(0);

    await slot1730.click();
    await page.locator('[data-testid="input-clientName"]').fill('E2E User');
    await page.locator('[data-testid="input-clientEmail"]').fill('e2e@example.com');
    await page.locator('[data-testid="input-clientPhone"]').fill('+421900123456');

    const bookingResponsePromise = page.waitForResponse('**/functions/v1/create-booking');
    await page.locator('[data-testid="submit-booking"]').click();
    const bookingResponse = await bookingResponsePromise;
    expect(bookingResponse.status()).toBe(201);
  });

  test('15-min service at 17:00 is also allowed (must pass)', async ({ page }) => {
    await setupBoundaryMocks(page, [SERVICE_15]);
    await openWizardAndSelectServiceAndDate(page, SERVICE_15.id);

    const slot1700 = page.locator('[data-testid="time-slot-17:00"]');
    await expect(slot1700).toBeVisible();
    await expect(slot1700).toBeEnabled();
  });

  test('55-min service at 17:00 is allowed, but 17:30 is blocked when closing is 18:00', async ({ page }) => {
    await setupBoundaryMocks(page, [SERVICE_55]);
    await openWizardAndSelectServiceAndDate(page, SERVICE_55.id);

    const slot1700 = page.locator('[data-testid="time-slot-17:00"]');
    const slot1730 = page.locator('[data-testid="time-slot-17:30"]');

    await expect(slot1700).toBeVisible();
    await expect(slot1700).toBeEnabled();
    await expect(slot1730).toBeVisible();
    await expect(slot1730).toBeDisabled();
  });
});
