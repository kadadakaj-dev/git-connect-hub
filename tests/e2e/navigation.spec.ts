import { test, expect } from '@playwright/test';

/**
 * Navigation & Routing E2E tests
 *
 * Covers:
 * - 404 / NotFound page rendering and back-home button
 * - All primary routes load without a white screen
 * - Footer legal links navigate to /legal
 * - /cancel without a token shows an error (not a crash)
 */

function skipSplashAndCookies(page: import('@playwright/test').Page) {
    return page.addInitScript(() => {
        window.sessionStorage.setItem('fyzio_splash_shown', 'true');
        window.localStorage.setItem('cookie-consent', 'accepted');
    });
}

test.describe('404 / NotFound page', () => {
    test.beforeEach(async ({ page }) => {
        await skipSplashAndCookies(page);
    });

    test('shows 404 page for an unknown route', async ({ page }) => {
        await page.goto('/this-route-does-not-exist');

        await expect(page.getByRole('heading', { name: '404' })).toBeVisible({ timeout: 10000 });
        await expect(
            page.getByText(/Stránka nenájdená|Page not found/i)
        ).toBeVisible();
    });

    test('back-to-home button on 404 page navigates to /', async ({ page }) => {
        await page.goto('/totally-unknown-path');

        const backBtn = page.getByRole('link', { name: /Späť na hlavnú stránku|Back to Home/i });
        await expect(backBtn).toBeVisible({ timeout: 10000 });
        await backBtn.click();

        await expect(page).toHaveURL('/');
    });

    test('deeply nested unknown admin route redirects to /auth (not authenticated)', async ({ page }) => {
        // /admin/* is behind AdminProtectedRoute — unauthenticated users get sent to /auth
        await page.goto('/admin/deep/unknown/route/xyz');

        await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
    });
});

test.describe('Primary routes smoke tests', () => {
    test.beforeEach(async ({ page }) => {
        await skipSplashAndCookies(page);

        // Minimal Supabase mocks so pages don't hang waiting for real network
        await page.route('**/rest/v1/**', async route => {
            await route.fulfill({ json: [] });
        });
        await page.route('**/functions/v1/**', async route => {
            await route.fulfill({ json: { success: true } });
        });
    });

    test('/ (homepage) loads and shows booking wizard', async ({ page }) => {
        await page.goto('/');
        // The booking wizard service-selection step should be visible
        await expect(
            page.getByText(/Vyberte službu|Select/i).first()
        ).toBeVisible({ timeout: 15000 });
    });

    test('/auth loads and shows login form', async ({ page }) => {
        await page.goto('/auth');
        await expect(
            page.getByRole('heading', { name: /Prihlásenie/i })
        ).toBeVisible({ timeout: 10000 });
    });

    test('/legal loads and shows Terms tab', async ({ page }) => {
        await page.goto('/legal');
        await expect(
            page.getByText(/Obchodné podmienky|Terms of Service/i).first()
        ).toBeVisible({ timeout: 10000 });
    });

    test('/portal without auth redirects to /auth', async ({ page }) => {
        await page.goto('/portal');
        await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
    });
});

test.describe('/cancel page edge cases', () => {
    test.beforeEach(async ({ page }) => {
        await skipSplashAndCookies(page);
    });

    test('shows invalid-link error when no token in URL', async ({ page }) => {
        await page.goto('/cancel');
        await expect(
            page.getByText(/Neplatný odkaz|Invalid cancellation link/i)
        ).toBeVisible({ timeout: 10000 });
    });

    test('shows error from API when token is not found', async ({ page }) => {
        await page.route('**/functions/v1/get-booking-by-token', async route => {
            await route.fulfill({ status: 404, json: { error: 'Not found' } });
        });

        await page.goto('/cancel?token=00000000-0000-0000-0000-000000000000');
        await expect(
            page.getByText(/Rezervácia nebola nájdená|Booking not found/i)
        ).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Footer navigation', () => {
    test.beforeEach(async ({ page }) => {
        await skipSplashAndCookies(page);
        await page.route('**/rest/v1/**', async route => {
            await route.fulfill({ json: [] });
        });
        await page.route('**/functions/v1/**', async route => {
            await route.fulfill({ json: { success: true } });
        });
    });

    test('footer Terms of Service link navigates to /legal?tab=terms', async ({ page }) => {
        await page.goto('/legal');
        const termsLink = page.getByRole('link', { name: /Obchodné podmienky|Terms of Service/i }).first();
        await expect(termsLink).toBeVisible({ timeout: 10000 });
        await termsLink.click();
        await expect(page).toHaveURL(/\/legal/);
        await expect(page).toHaveURL(/tab=terms/);
    });

    test('footer Privacy Policy link navigates to /legal?tab=privacy', async ({ page }) => {
        await page.goto('/legal');
        const privacyLink = page.getByRole('link', { name: /Ochrana údajov|Privacy Policy/i }).first();
        await expect(privacyLink).toBeVisible({ timeout: 10000 });
        await privacyLink.click();
        await expect(page).toHaveURL(/\/legal/);
        await expect(page).toHaveURL(/tab=privacy/);
    });
});
