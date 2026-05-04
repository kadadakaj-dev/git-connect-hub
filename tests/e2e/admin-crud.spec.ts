import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/admin-fixtures';

test.describe('Admin CRUD Regression', () => {
    test.beforeEach(async ({ page }) => {
        // Uses real credentials (VITE_TEST_ADMIN_EMAIL = booking@fyzioafit.sk).
        // Mock auth tokens are rejected by the Supabase JS client locally, so
        // only resource API calls are mocked here.

        await page.route('**/rest/v1/services*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    json: [{ id: 's1', name_sk: 'Service 1', price: 10, duration: 30, is_active: true, category: 'chiropractic', icon: 'Activity', sort_order: 0 }]
                });
            } else {
                await route.fulfill({ status: 200, json: { success: true } });
            }
        });

        await page.route('**/rest/v1/employees*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    json: [{ id: 'e1', full_name: 'Employee 1', email: 'e1@example.com', position: 'therapist', is_active: true, sort_order: 0 }]
                });
            } else {
                await route.fulfill({ status: 200, json: { success: true } });
            }
        });

        await page.route('**/rest/v1/time_slots_config*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    json: [{ id: 'c1', day_of_week: 1, start_time: '09:00', end_time: '17:00', is_active: true }]
                });
            } else {
                await route.fulfill({ status: 200, json: { success: true } });
            }
        });

        // CalendarView fetches these — mock them so fetchData completes quickly and
        // the calendar tab renders even when Supabase is not running locally.
        await page.route('**/rest/v1/blocked_dates*', async route => {
            await route.fulfill({ json: [] });
        });

        await page.route('**/rest/v1/blocked_slots*', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({ status: 201, json: [] });
            } else {
                await route.fulfill({ json: [] });
            }
        });

        await page.route('**/rest/v1/bookings*', async route => {
            await route.fulfill({ json: [] });
        });

        await page.route('**/rest/v1/rpc/get_booking_slot_counts*', async route => {
            await route.fulfill({ json: [] });
        });

        await loginAsAdmin(page);
        // Confirm we are on the admin dashboard
        await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });
    });

    test('should manage services (CRUD)', async ({ page }) => {
        // Admin uses Tabs — navigate with role="tab", not nav a/button
        await page.getByRole('tab', { name: /Služby|Services/i }).click();
        await expect(page.getByText(/Správa služieb/i)).toBeVisible();

        // Create
        await page.click('button:has-text("Pridať službu")');
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByTestId('input-name_sk').fill('New Service SK');
        await page.getByTestId('input-name_en').fill('New Service EN');
        await page.getByTestId('input-description_sk').fill('Desc SK');
        await page.getByTestId('input-description_en').fill('Desc EN');
        await page.locator('input[type="number"]').first().fill('45'); // Duration
        await page.locator('input[type="number"]').nth(1).fill('50'); // Price

        await page.click('button:has-text("Vytvoriť")');
        await expect(page.getByText(/Služba vytvorená/i)).toBeVisible();

        // Update
        await page.locator('button[aria-label="Upraviť"]').first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByTestId('input-name_sk').fill('Updated Service');
        await page.click('button:has-text("Uložiť")');
        await expect(page.getByText(/Služba aktualizovaná/i)).toBeVisible();

        // Delete
        page.on('dialog', dialog => dialog.accept());
        await page.locator('button[aria-label="Odstrániť"]').first().click();
        await expect(page.getByText(/Služba zmazaná/i)).toBeVisible();
    });

    test('should manage employees (CRUD)', async ({ page }) => {
        await page.getByRole('tab', { name: /Zamestnanci|Employees/i }).click();
        await expect(page.getByText(/Správa zamestnancov/i)).toBeVisible();

        // Create
        await page.click('button:has-text("Pridať zamestnanca")');
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByTestId('input-full_name').fill('New Employee');
        await page.locator('input[type="email"]').fill('new@e.com');
        await page.click('button:has-text("Vytvoriť")');
        await expect(page.getByText(/Uložené/i)).toBeVisible();

        // Update
        await page.locator('button[aria-label="Upraviť"]').first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByTestId('input-full_name').fill('Updated Employee');
        await page.click('button:has-text("Uložiť")');
        await expect(page.getByText(/Uložené/i)).toBeVisible();

        // Delete
        page.on('dialog', dialog => dialog.accept());
        await page.locator('button[aria-label="Odstrániť"]').first().click();
        await expect(page.getByText(/Zamestnanec zmazaný/i)).toBeVisible();
    });

    test('should manage opening hours', async ({ page }) => {
        await page.getByRole('tab', { name: /Hodiny|Hours|Nastavenia|Settings/i }).click();
        await expect(page.getByText(/Otváracie hodiny/i)).toBeVisible();

        const mondayRow = page.locator('div:has-text("Pondelok")');
        await mondayRow.locator('input[type="time"]').first().fill('08:00');
        await mondayRow.locator('input[type="time"]').last().fill('18:00');

        await page.click('button:has-text("Uložiť")');
        await expect(page.getByText(/Otváracie hodiny uložené/i)).toBeVisible();
    });

    test('should block a specific slot in calendar', async ({ page }) => {
        await page.getByRole('tab', { name: /Kalendár|Calendar/i }).click();

        await page.route('**/rest/v1/rpc/get_booking_slot_counts*', async route => {
            await route.fulfill({ json: [] });
        });

        await page.getByRole('button', { name: /Blokovať|Block/i }).first().click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

        // EventModal title has data-testid="input-title"
        await page.getByTestId('input-title').fill('Test Block');
        await page.getByRole('button', { name: /Uložiť|Save/i }).click();

        await expect(
            page.getByText(/Čas bol zablokovaný/i).or(page.getByText(/Deň zablokovaný/i))
        ).toBeVisible();
    });
});
