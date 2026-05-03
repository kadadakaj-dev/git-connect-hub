import { test, expect } from '@playwright/test';

/**
 * Language-switching E2E tests
 *
 * Covers:
 * - Default language on the homepage is Slovak
 * - Clicking EN in the footer LanguageSwitcher changes UI to English
 * - Clicking SK restores Slovak UI
 * - The selected language persists across client-side navigation
 * - Language switching works on the /legal and /cancel pages
 */

function skipSplashAndCookies(page: import('@playwright/test').Page) {
    return page.addInitScript(() => {
        window.sessionStorage.setItem('fyzio_splash_shown', 'true');
        window.localStorage.setItem('cookie-consent', 'accepted');
        // Prevent TanStack Query DevTools from auto-opening (key = prefix + "." + fieldName)
        window.localStorage.setItem('TanstackQueryDevtools.open', 'false');
    });
}

/** Close the TanStack Query Devtools panel if it is open (can persist across browser contexts in the same browser instance). */
async function closeDevtoolsIfOpen(page: import('@playwright/test').Page) {
    // The DevTools can initialise asynchronously; give it up to 1.5 s to show.
    const closeBtn = page.getByRole('button', { name: /Close tanstack query devtools/i });
    if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await closeBtn.click();
        // Wait until the panel is gone before continuing
        await closeBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
}

/** Click the EN or SK language button. Prefers the footer-scoped button (avoids DevTools overlay); falls back to the full page for pages that render LanguageSwitcher outside a <footer> (e.g. /cancel). */
async function switchLanguage(page: import('@playwright/test').Page, lang: 'EN' | 'SK') {
    const footerBtn = page.locator('footer').getByRole('button', { name: lang });
    if (await footerBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await footerBtn.click({ force: true });
    } else {
        await page.getByRole('button', { name: lang }).first().click({ force: true });
    }
}

/** Minimal booking-wizard mocks so the homepage renders completely. */
async function mockHomepageResources(page: import('@playwright/test').Page) {
    await page.route('**/rest/v1/services*', async route => {
        await route.fulfill({
            json: [{
                id: 'svc-1',
                name_sk: 'Testová služba',
                name_en: 'Test Service',
                price: 30,
                duration: 30,
                category: 'physiotherapy',
                icon: 'Activity',
                is_active: true,
            }],
        });
    });
    await page.route('**/rest/v1/time_slots_config*', async route => {
        await route.fulfill({ json: [{ id: 'm0', day_of_week: 1, start_time: '09:00', end_time: '17:00', is_active: true }] });
    });
    await page.route('**/rest/v1/employees_public*', async route => {
        await route.fulfill({ json: [{ id: 'e1', is_active: true, full_name: 'Test Employee' }] });
    });
    await page.route('**/rest/v1/blocked_dates*', async route => {
        await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/rpc/get_booking_slot_counts*', async route => {
        await route.fulfill({ json: [] });
    });
}

test.describe('Language switching — homepage', () => {
    test.beforeEach(async ({ page }) => {
        await skipSplashAndCookies(page);
        await mockHomepageResources(page);
    });

    test('default language is Slovak (Vyberte službu visible)', async ({ page }) => {
        await page.goto('/');
        await closeDevtoolsIfOpen(page);

        // The booking wizard step-1 heading is in Slovak by default
        await expect(
            page.getByText(/Vyberte službu/i).first()
        ).toBeVisible({ timeout: 15000 });
    });

    test('switching to EN changes booking wizard heading to English', async ({ page }) => {
        await page.goto('/');
        await closeDevtoolsIfOpen(page);

        // Wait for SK text first
        await expect(page.getByText(/Vyberte službu/i).first()).toBeVisible({ timeout: 15000 });

        // Footer LanguageSwitcher — click EN (scoped to footer to avoid DevTools interference)
        await switchLanguage(page, 'EN');

        // EN heading should appear
        await expect(
            page.getByText(/Select Your Service|Select service/i).first()
        ).toBeVisible({ timeout: 10000 });

        // SK heading should disappear
        await expect(page.getByText(/Vyberte službu/i)).toHaveCount(0);
    });

    test('switching SK → EN → SK restores Slovak text', async ({ page }) => {
        await page.goto('/');
        await closeDevtoolsIfOpen(page);
        await expect(page.getByText(/Vyberte službu/i).first()).toBeVisible({ timeout: 15000 });

        // Switch to EN
        await switchLanguage(page, 'EN');
        await expect(page.getByText(/Select Your Service|Select service/i).first()).toBeVisible({ timeout: 10000 });

        // Switch back to SK
        await switchLanguage(page, 'SK');
        await expect(page.getByText(/Vyberte službu/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('SK button is visually highlighted when SK is active', async ({ page }) => {
        await page.goto('/');
        await closeDevtoolsIfOpen(page);
        await expect(page.getByText(/Vyberte službu/i).first()).toBeVisible({ timeout: 15000 });

        // When language is SK, the SK button should have the active class (bg-navy)
        const skBtn = page.locator('footer').getByRole('button', { name: 'SK' });
        await expect(skBtn).toHaveClass(/bg-navy/);
    });

    test('EN button is visually highlighted after switching to EN', async ({ page }) => {
        await page.goto('/');
        await closeDevtoolsIfOpen(page);
        await expect(page.getByText(/Vyberte službu/i).first()).toBeVisible({ timeout: 15000 });

        await switchLanguage(page, 'EN');

        const enBtn = page.locator('footer').getByRole('button', { name: 'EN' });
        await expect(enBtn).toHaveClass(/bg-navy/, { timeout: 5000 });
    });
});

test.describe('Language switching — Legal page', () => {
    test.beforeEach(async ({ page }) => {
        await skipSplashAndCookies(page);
    });

    test('EN switch on /legal shows English tab labels', async ({ page }) => {
        await page.goto('/legal');
        await closeDevtoolsIfOpen(page);

        await expect(
            page.getByRole('tab', { name: /Obchodné podmienky/i })
        ).toBeVisible({ timeout: 10000 });

        await switchLanguage(page, 'EN');

        await expect(
            page.locator('[role="tab"]').filter({ hasText: 'Terms of Service' }).first()
        ).toBeVisible({ timeout: 10000 });

        await expect(
            page.locator('[role="tab"]').filter({ hasText: 'Privacy Policy' }).first()
        ).toBeVisible();
    });

    test('EN switch changes back-button text to English', async ({ page }) => {
        await page.goto('/legal');
        await closeDevtoolsIfOpen(page);

        // Wait for the page to be fully rendered before switching language
        await expect(
            page.getByRole('tab', { name: /Obchodné podmienky/i })
        ).toBeVisible({ timeout: 10000 });

        await switchLanguage(page, 'EN');

        // The back button text should change to English
        await expect(
            page.getByText('Back to booking', { exact: false }).first()
        ).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Language switching — Cancel page', () => {
    test.beforeEach(async ({ page }) => {
        await skipSplashAndCookies(page);
    });

    test('EN switch on /cancel shows English error text', async ({ page }) => {
        await page.goto('/cancel');
        await closeDevtoolsIfOpen(page);

        // Default SK
        await expect(
            page.getByText(/Neplatný odkaz/i)
        ).toBeVisible({ timeout: 10000 });

        // Switch to EN via LanguageSwitcher (present on CancelBooking page)
        await switchLanguage(page, 'EN');

        await expect(
            page.getByText(/Invalid cancellation link/i)
        ).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Language persistence across client-side navigation', () => {
    test.beforeEach(async ({ page }) => {
        await skipSplashAndCookies(page);
        await mockHomepageResources(page);
    });

    test('language persists when navigating to /legal via footer link (client-side)', async ({ page }) => {
        await page.goto('/');
        await closeDevtoolsIfOpen(page);
        await expect(page.getByText(/Vyberte službu/i).first()).toBeVisible({ timeout: 15000 });

        // Switch to EN
        await switchLanguage(page, 'EN');
        await expect(page.getByText(/Select Your Service|Select service/i).first()).toBeVisible({ timeout: 10000 });

        // Navigate to /legal via client-side footer link (React Router — no full reload)
        const termsLink = page.locator('footer').getByRole('link', { name: /Terms of Service/i }).first();
        await expect(termsLink).toBeVisible();
        await termsLink.click();

        // Still on /legal in EN — tab labels in English
        await expect(page).toHaveURL(/\/legal/);
        await expect(
            page.locator('[role="tab"]').filter({ hasText: 'Terms of Service' }).first()
        ).toBeVisible({ timeout: 10000 });
    });
});
