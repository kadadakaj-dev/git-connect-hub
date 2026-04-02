import { expect, test } from '@playwright/test';

test.describe('Client auth smoke flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.sessionStorage.setItem('fyzio_splash_shown', 'true');
            window.localStorage.setItem('cookie-consent', 'accepted');
        });
    });

    test('renders auth page without OAuth buttons', async ({ page }) => {
        await page.goto('/auth');

        await expect(page.getByRole('heading', { name: /Vitajte späť|Welcome back/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Prihlásenie|Login/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Registrácia|Register/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Google/i })).toHaveCount(0);
        await expect(page.getByRole('button', { name: /Apple/i })).toHaveCount(0);
    });

    test('shows client-side validation on invalid login form', async ({ page }) => {
        await page.goto('/auth');

        await page.getByRole('button', { name: /Prihlásiť sa|Sign In/i }).click();

        await expect(page.getByText(/Neplatný email|Invalid email/i)).toBeVisible();
        await expect(page.getByText(/Heslo musí mať aspoň 6 znakov|Password must be at least 6 characters/i)).toBeVisible();
    });

    test('can switch to reset password form and back', async ({ page }) => {
        await page.goto('/auth');

        await page.getByRole('button', { name: /Zabudli ste heslo|Forgot password/i }).click();
        await expect(page.getByRole('heading', { name: /Obnoviť heslo|Reset Password/i })).toBeVisible();
        await expect(page.getByText(/Zadajte email|Enter your email/i)).toBeVisible();

        await page.getByRole('button', { name: /Späť na prihlásenie|Back to login/i }).click();
        await expect(page.getByRole('tab', { name: /Prihlásenie|Login/i })).toBeVisible();
    });

    test('shows registration validation before any backend call', async ({ page }) => {
        await page.goto('/auth');

        await page.getByRole('tab', { name: /Registrácia|Register/i }).click();
        await page.getByRole('button', { name: /Zaregistrovať sa|Sign Up/i }).click();

        await expect(page.getByText(/Meno musí mať aspoň 2 znaky/i)).toBeVisible();
        await expect(page.getByText(/Neplatný email|Invalid email/i)).toBeVisible();
        await expect(page.getByText(/Heslo musí mať aspoň 6 znakov|Password must be at least 6 characters/i)).toBeVisible();
    });
});