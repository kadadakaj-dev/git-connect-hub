import { test, expect } from '@playwright/test';

/**
 * Cookie banner E2E tests
 *
 * Covers:
 * - Banner appears (after a short delay) when no consent is stored
 * - "Accept" button stores 'accepted' in localStorage and hides the banner
 * - "Decline" button stores 'declined' in localStorage and hides the banner
 * - Dismiss (×) button stores 'declined' and hides the banner
 * - Banner does NOT appear when consent was already stored
 * - "Learn more" / "Viac informácií" link navigates to /legal?tab=privacy
 */

test.describe('Cookie banner', () => {
    // ── Helpers ────────────────────────────────────────────────────────────────

    /** Load the homepage WITHOUT any pre-stored cookie consent. */
    async function gotoWithNoCookieConsent(page: import('@playwright/test').Page) {
        // Only bypass the splash screen — do NOT pre-set cookie-consent
        await page.addInitScript(() => {
            window.sessionStorage.setItem('fyzio_splash_shown', 'true');
            // Prevent TanStack Query DevTools from auto-opening
            window.localStorage.setItem('TanstackQueryDevtools.open', 'false');
        });

        // Minimal API mocks to prevent the page from hanging
        await page.route('**/rest/v1/**', async route => route.fulfill({ json: [] }));
        await page.route('**/functions/v1/**', async route => route.fulfill({ json: { success: true } }));

        await page.goto('/');
    }

    // ── Appearance ─────────────────────────────────────────────────────────────

    test('banner appears after ~1 s when no consent is stored', async ({ page }) => {
        await gotoWithNoCookieConsent(page);

        // CookieBanner has a 1 000 ms delay — wait up to 5 s
        const acceptBtn = page.getByRole('button', { name: /Súhlasím|Accept/i });
        await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    });

    test('banner shows both Accept and Decline buttons', async ({ page }) => {
        await gotoWithNoCookieConsent(page);

        await expect(page.getByRole('button', { name: /Súhlasím|Accept/i })).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('button', { name: /Odmietnuť|Decline/i })).toBeVisible({ timeout: 5000 });
    });

    test('banner NOT shown when consent is already "accepted"', async ({ page }) => {
        await page.addInitScript(() => {
            window.sessionStorage.setItem('fyzio_splash_shown', 'true');
            window.localStorage.setItem('cookie-consent', 'accepted');
        });
        await page.route('**/rest/v1/**', async route => route.fulfill({ json: [] }));
        await page.goto('/');

        // Wait long enough that the banner would have appeared (1 000 ms + margin)
        await page.waitForTimeout(2000);
        await expect(page.getByRole('button', { name: /Súhlasím|Accept/i })).toHaveCount(0);
    });

    test('banner NOT shown when consent is already "declined"', async ({ page }) => {
        await page.addInitScript(() => {
            window.sessionStorage.setItem('fyzio_splash_shown', 'true');
            window.localStorage.setItem('cookie-consent', 'declined');
        });
        await page.route('**/rest/v1/**', async route => route.fulfill({ json: [] }));
        await page.goto('/');

        await page.waitForTimeout(2000);
        await expect(page.getByRole('button', { name: /Súhlasím|Accept/i })).toHaveCount(0);
    });

    // ── Accept ─────────────────────────────────────────────────────────────────

    test('clicking Accept stores "accepted" in localStorage and hides banner', async ({ page }) => {
        await gotoWithNoCookieConsent(page);

        const acceptBtn = page.getByRole('button', { name: /Súhlasím|Accept/i });
        await expect(acceptBtn).toBeVisible({ timeout: 5000 });
        await acceptBtn.click();

        // Banner should disappear
        await expect(acceptBtn).toHaveCount(0, { timeout: 3000 });

        // localStorage must be set
        const stored = await page.evaluate(() => localStorage.getItem('cookie-consent'));
        expect(stored).toBe('accepted');
    });

    // ── Decline ────────────────────────────────────────────────────────────────

    test('clicking Decline stores "declined" in localStorage and hides banner', async ({ page }) => {
        await gotoWithNoCookieConsent(page);

        const declineBtn = page.getByRole('button', { name: /Odmietnuť|Decline/i });
        await expect(declineBtn).toBeVisible({ timeout: 5000 });
        await declineBtn.click();

        await expect(declineBtn).toHaveCount(0, { timeout: 3000 });

        const stored = await page.evaluate(() => localStorage.getItem('cookie-consent'));
        expect(stored).toBe('declined');
    });

    test('clicking × (close) button stores "declined" and hides banner', async ({ page }) => {
        await gotoWithNoCookieConsent(page);

        // Wait for banner
        await expect(page.getByRole('button', { name: /Súhlasím|Accept/i })).toBeVisible({ timeout: 5000 });

        const closeBtn = page.getByRole('button', { name: /Close/i });
        await expect(closeBtn).toBeVisible();
        await closeBtn.click();

        await expect(page.getByRole('button', { name: /Súhlasím|Accept/i })).toHaveCount(0, { timeout: 3000 });

        const stored = await page.evaluate(() => localStorage.getItem('cookie-consent'));
        expect(stored).toBe('declined');
    });

    // ── Learn more link ────────────────────────────────────────────────────────

    test('"Viac informácií / Learn more" link navigates to /legal?tab=privacy', async ({ page }) => {
        await gotoWithNoCookieConsent(page);

        const learnMore = page.getByRole('link', { name: /Viac informácií|Learn more/i });
        await expect(learnMore).toBeVisible({ timeout: 5000 });
        await learnMore.click();

        await expect(page).toHaveURL(/\/legal/);
        await expect(page).toHaveURL(/tab=privacy/);
    });
});
