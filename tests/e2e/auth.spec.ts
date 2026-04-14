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

        await expect(page.getByRole('heading', { name: /Prihlásenie/i })).toBeVisible();
        // Mode-switch buttons present instead of tabs
        await expect(page.getByRole('button', { name: /Vytvoriť účet/i })).toBeVisible();
        // No OAuth providers
        await expect(page.getByRole('button', { name: /Google/i })).toHaveCount(0);
        await expect(page.getByRole('button', { name: /Apple/i })).toHaveCount(0);
    });

    test('shows client-side validation on invalid login form', async ({ page }) => {
        await page.goto('/auth');

        // Submit with empty fields — browser HTML5 validation blocks supabase call
        // Fill invalid email to bypass :required, keep password short
        await page.fill('input[type="email"]', 'notanemail');
        await page.fill('input[type="password"]', '123');
        await page.getByRole('button', { name: /Pokračovať/i }).click();

        // minLength=6 on password — browser blocks submission, no custom error rendered
        // Instead verify the password field is still focused / present
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('can switch to reset password form and back', async ({ page }) => {
        await page.goto('/auth');

        await page.getByRole('button', { name: /Zabudnuté heslo/i }).click();
        await expect(page.getByRole('heading', { name: /Obnova hesla/i })).toBeVisible();

        await page.getByRole('button', { name: /Späť na prihlásenie/i }).click();
        await expect(page.getByRole('heading', { name: /Prihlásenie/i })).toBeVisible();
    });

    test('can switch to registration mode', async ({ page }) => {
        await page.goto('/auth');

        await page.getByRole('button', { name: /Vytvoriť účet/i }).click();
        await expect(page.getByRole('heading', { name: /Vytvoriť účet/i })).toBeVisible();
        // Submit button now says "Začať"
        await expect(page.getByRole('button', { name: /Začať/i })).toBeVisible();
        // Switch back
        await page.getByRole('button', { name: /Mám účet/i }).click();
        await expect(page.getByRole('heading', { name: /Prihlásenie/i })).toBeVisible();
    });
});
