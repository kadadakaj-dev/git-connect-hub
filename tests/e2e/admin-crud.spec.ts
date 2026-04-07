import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/admin-fixtures';

test.describe('Admin CRUD Regression', () => {
    test.beforeEach(async ({ page }) => {
        // Mock admin auth and resources
        await page.route('**/auth/v1/user*', async route => {
            await route.fulfill({ json: { id: 'admin-id', email: 'admin@example.com' } });
        });

        await page.route('**/auth/v1/token*', async route => {
            await route.fulfill({ 
                json: { 
                    access_token: 'mock-token', 
                    token_type: 'bearer', 
                    expires_in: 3600, 
                    refresh_token: 'mock-refresh', 
                    user: { id: 'admin-id', email: 'admin@example.com' } 
                } 
            });
        });

        await page.route('**/rest/v1/user_roles*', async route => {
            await route.fulfill({ json: [{ role: 'admin', user_id: 'admin-id' }] });
        });
        
        // Mock services
        await page.route('**/rest/v1/services*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    json: [{ id: 's1', name_sk: 'Service 1', price: 10, duration: 30, is_active: true, category: 'chiropractic', icon: 'Activity', sort_order: 0 }]
                });
            } else {
                await route.fulfill({ status: 200, json: { success: true } });
            }
        });

        // Mock employees
        await page.route('**/rest/v1/employees*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    json: [{ id: 'e1', full_name: 'Employee 1', email: 'e1@example.com', position: 'therapist', is_active: true, sort_order: 0 }]
                });
            } else {
                await route.fulfill({ status: 200, json: { success: true } });
            }
        });

        // Mock time slots config
        await page.route('**/rest/v1/time_slots_config*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    json: [{ id: 'c1', day_of_week: 1, start_time: '09:00', end_time: '17:00', is_active: true }]
                });
            } else {
                await route.fulfill({ status: 200, json: { success: true } });
            }
        });

        await loginAsAdmin(page);
    });

    test('should manage services (CRUD)', async ({ page }) => {
        await page.click('nav a:has-text("Služby"), nav button:has-text("Služby")');
        await expect(page.getByText(/Správa služieb/i)).toBeVisible();

        // 1. Create
        await page.click('button:has-text("Pridať službu")');
        await page.fill('input[id="name_sk"]', 'New Service SK');
        await page.fill('input[id="name_en"]', 'New Service EN');
        await page.fill('textarea[id="description_sk"]', 'Desc SK');
        await page.fill('textarea[id="description_en"]', 'Desc EN');
        await page.fill('input[type="number"]', '45'); // Duration
        // Use more specific selector for price if needed
        await page.locator('input[type="number"]').nth(1).fill('50'); // Price
        
        await page.click('button:has-text("Vytvoriť")');
        await expect(page.getByText(/Služba vytvorená/i)).toBeVisible();

        // 2. Update
        await page.locator('button[aria-label="Upraviť"]').first().click();
        await page.fill('input[id="name_sk"]', 'Updated Service');
        await page.click('button:has-text("Uložiť")');
        await expect(page.getByText(/Služba aktualizovaná/i)).toBeVisible();

        // 3. Delete
        page.on('dialog', dialog => dialog.accept());
        await page.locator('button[aria-label="Odstrániť"]').first().click();
        await expect(page.getByText(/Služba zmazaná/i)).toBeVisible();
    });

    test('should manage employees (CRUD)', async ({ page }) => {
        await page.click('nav a:has-text("Zamestnanci"), nav button:has-text("Zamestnanci")');
        await expect(page.getByText(/Správa zamestnancov/i)).toBeVisible();

        // 1. Create
        await page.click('button:has-text("Pridať zamestnanca")');
        await page.fill('input[id="full_name"]', 'New Employee');
        await page.fill('input[type="email"]', 'new@e.com');
        await page.click('button:has-text("Vytvoriť")');
        await expect(page.getByText(/Uložené/i)).toBeVisible();

        // 2. Update
        await page.locator('button[aria-label="Upraviť"]').first().click();
        await page.fill('input[id="full_name"]', 'Updated Employee');
        await page.click('button:has-text("Uložiť")');
        await expect(page.getByText(/Uložené/i)).toBeVisible();

        // 3. Delete
        page.on('dialog', dialog => dialog.accept());
        await page.locator('button[aria-label="Odstrániť"]').first().click();
        await expect(page.getByText(/Zamestnanec zmazaný/i)).toBeVisible();
    });

    test('should manage opening hours', async ({ page }) => {
        await page.click('nav a:has-text("Nastavenia"), nav button:has-text("Nastavenia")');
        // If settings has multiple tabs, might need to click one
        await expect(page.getByText(/Otváracie hodiny/i)).toBeVisible();

        // Update Monday hours
        const mondayRow = page.locator('div:has-text("Pondelok")');
        await mondayRow.locator('input[type="time"]').first().fill('08:00');
        await mondayRow.locator('input[type="time"]').last().fill('18:00');

        await page.click('button:has-text("Uložiť")');
        await expect(page.getByText(/Otváracie hodiny uložené/i)).toBeVisible();
    });

    test('should block a specific slot in calendar', async ({ page }) => {
        await page.click('nav a:has-text("Kalendár"), nav button:has-text("Kalendár")');
        
        // Mock slots response for calendar
        await page.route('**/rest/v1/rpc/get_booking_slot_counts*', async route => {
            await route.fulfill({ json: [] });
        });

        // Click "Blokovať" button in header
        await page.click('button:has-text("Blokovať")');
        
        // Modal should open
        await expect(page.getByText(/Nová blokácia/i).or(page.getByText(/New Block/i))).toBeVisible();
        await page.fill('input[id="title"]', 'Test Block');
        await page.click('button:has-text("Uložiť")');
        
        await expect(page.getByText(/Čas bol zablokovaný/i).or(page.getByText(/Deň zablokovaný/i))).toBeVisible();
    });
});
