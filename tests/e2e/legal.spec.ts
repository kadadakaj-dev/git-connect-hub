import { test, expect } from '@playwright/test';

/**
 * Legal page E2E tests
 *
 * Covers:
 * - Default tab is "Terms of Service"
 * - Clicking the Privacy tab shows privacy content
 * - ?tab=privacy URL parameter opens Privacy tab directly
 * - ?tab=terms URL parameter opens Terms tab directly
 * - Back-to-home button returns to /
 * - Language switching (SK ↔ EN) updates visible heading text
 */

function skipSplashAndCookies(page: import('@playwright/test').Page) {
    return page.addInitScript(() => {
        window.sessionStorage.setItem('fyzio_splash_shown', 'true');
        window.localStorage.setItem('cookie-consent', 'accepted');
        // Prevent TanStack Query DevTools from auto-opening (key = prefix + "." + fieldName)
        window.localStorage.setItem('TanstackQueryDevtools.open', 'false');
    });
}

/** Close the TanStack Query DevTools panel if it is open (it can persist across browser contexts in the same browser instance). */
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

test.describe('Legal page', () => {
    test.beforeEach(async ({ page }) => {
        await skipSplashAndCookies(page);
    });

    // helper scoped to this describe so every navigation has devtools dismissed
    async function gotoLegal(page: import('@playwright/test').Page, url = '/legal') {
        await page.goto(url);
        await closeDevtoolsIfOpen(page);
    }

    // ── Tab rendering ──────────────────────────────────────────────────────────

    test('shows Terms tab by default on /legal', async ({ page }) => {
        await gotoLegal(page);

        // Tab trigger should be selected
        const termsTab = page.getByRole('tab', { name: /Obchodné podmienky|Terms of Service/i });
        await expect(termsTab).toBeVisible({ timeout: 10000 });
        await expect(termsTab).toHaveAttribute('data-state', 'active');

        // Section heading visible
        await expect(
            page.getByRole('heading', { name: /Obchodné podmienky|Terms of Service/i }).first()
        ).toBeVisible();
    });

    test('switching to Privacy tab shows privacy content', async ({ page }) => {
        await gotoLegal(page);

        const privacyTab = page.getByRole('tab', { name: /Ochrana osobných údajov|Privacy Policy|Ochrana údajov/i });
        await expect(privacyTab).toBeVisible({ timeout: 10000 });
        await privacyTab.click();

        await expect(privacyTab).toHaveAttribute('data-state', 'active');
        // Privacy heading must appear
        await expect(
            page.getByRole('heading', { name: /Ochrana osobných údajov.*GDPR|Privacy Policy/i }).first()
        ).toBeVisible();
    });

    test('switching back to Terms tab restores terms content', async ({ page }) => {
        await gotoLegal(page, '/legal?tab=privacy');

        const termsTab = page.getByRole('tab', { name: /Obchodné podmienky|Terms of Service/i });
        await expect(termsTab).toBeVisible({ timeout: 10000 });
        await termsTab.click();

        await expect(termsTab).toHaveAttribute('data-state', 'active');
        await expect(
            page.getByRole('heading', { name: /Obchodné podmienky|Terms of Service/i }).first()
        ).toBeVisible();
    });

    // ── URL parameter ──────────────────────────────────────────────────────────

    test('?tab=privacy opens Privacy tab directly', async ({ page }) => {
        await gotoLegal(page, '/legal?tab=privacy');

        const privacyTab = page.getByRole('tab', { name: /Ochrana osobných údajov|Privacy Policy|Ochrana údajov/i });
        await expect(privacyTab).toHaveAttribute('data-state', 'active', { timeout: 10000 });

        // At least one GDPR heading section should be visible
        await expect(
            page.getByText(/GDPR/i).first()
        ).toBeVisible();
    });

    test('?tab=terms opens Terms tab directly', async ({ page }) => {
        await gotoLegal(page, '/legal?tab=terms');

        const termsTab = page.getByRole('tab', { name: /Obchodné podmienky|Terms of Service/i });
        await expect(termsTab).toHaveAttribute('data-state', 'active', { timeout: 10000 });
    });

    // ── Navigation ─────────────────────────────────────────────────────────────

    test('back-to-home button returns to /', async ({ page }) => {
        await page.route('**/rest/v1/**', async route => route.fulfill({ json: [] }));
        await gotoLegal(page);

        const backBtn = page.getByRole('button', { name: /Späť na rezerváciu|Back to booking/i });
        await expect(backBtn).toBeVisible({ timeout: 10000 });
        await backBtn.click();

        await expect(page).toHaveURL('/');
    });

    // ── Language ───────────────────────────────────────────────────────────────

    test('switching to EN changes tab labels and content headings', async ({ page }) => {
        await gotoLegal(page);

        // Verify SK heading first
        await expect(
            page.getByRole('heading', { name: /Obchodné podmienky/ }).first()
        ).toBeVisible({ timeout: 10000 });

        // Switch to EN via the footer LanguageSwitcher (scoped to footer to avoid DevTools interference)
        await switchLanguage(page, 'EN');

        // After switch, the tab label and content heading should be in English
        await expect(
            page.locator('[role="tab"]').filter({ hasText: 'Terms of Service' }).first()
        ).toBeVisible({ timeout: 10000 });
        await expect(
            page.getByRole('heading', { name: /Terms of Service/i }).first()
        ).toBeVisible();
    });

    test('switching to SK on EN page restores Slovak content', async ({ page }) => {
        await gotoLegal(page);

        // Wait for the page to be fully rendered before switching language
        await expect(
            page.locator('[role="tab"]').filter({ hasText: 'Obchodné podmienky' }).first()
        ).toBeVisible({ timeout: 10000 });

        // Switch to EN (scoped to footer to avoid DevTools interference)
        await switchLanguage(page, 'EN');
        await expect(
            page.locator('[role="tab"]').filter({ hasText: 'Terms of Service' }).first()
        ).toBeVisible({ timeout: 10000 });

        // Switch back to SK
        await switchLanguage(page, 'SK');
        await expect(
            page.locator('[role="tab"]').filter({ hasText: 'Obchodné podmienky' }).first()
        ).toBeVisible({ timeout: 10000 });
    });

    // ── Content ────────────────────────────────────────────────────────────────

    test('Terms tab shows at least 3 section headings', async ({ page }) => {
        await gotoLegal(page);
        await expect(
            page.getByRole('tab', { name: /Obchodné podmienky|Terms of Service/i })
        ).toHaveAttribute('data-state', 'active', { timeout: 10000 });

        // Terms content should have numbered section headings (1., 2., 3., …)
        const headings = page.locator('h3').filter({ hasText: /^[1-9]\. / });
        const count = await headings.count();
        expect(count).toBeGreaterThanOrEqual(3);
    });

    test('Privacy tab shows GDPR section headings', async ({ page }) => {
        await gotoLegal(page, '/legal?tab=privacy');

        const headings = page.locator('h3').filter({ hasText: /^[1-9]\. / });
        await expect(headings.first()).toBeVisible({ timeout: 10000 });
        const count = await headings.count();
        expect(count).toBeGreaterThanOrEqual(3);
    });
});
