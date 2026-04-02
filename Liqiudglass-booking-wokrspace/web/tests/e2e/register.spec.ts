import { expect, test } from "@playwright/test";

test.describe("registration page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded", timeout: 30_000 });
  });

  test("renders registration form with all fields", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /registrácia/i })).toBeVisible();
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel("Heslo", { exact: true })).toBeVisible();
    await expect(page.getByLabel(/potvrďte heslo/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /zaregistrovať/i })).toBeVisible();
  });

  test("shows error when passwords do not match", async ({ page }) => {
    await page.getByLabel(/e-mail/i).fill("test@example.com");
    await page.getByLabel("Heslo", { exact: true }).fill("Password123!");
    await page.getByLabel(/potvrďte heslo/i).fill("DifferentPassword!");

    await page.getByRole("button", { name: /zaregistrovať/i }).click();

    await expect(page.getByText(/heslá sa nezhodujú/i)).toBeVisible({ timeout: 5_000 });
  });

  test("shows error when password is too short", async ({ page }) => {
    await page.getByLabel(/e-mail/i).fill("test@example.com");
    await page.getByLabel("Heslo", { exact: true }).fill("short");
    await page.getByLabel(/potvrďte heslo/i).fill("short");

    await page.getByRole("button", { name: /zaregistrovať/i }).click();

    await expect(page.getByText(/aspoň 8 znakov/i)).toBeVisible({ timeout: 5_000 });
  });

  test("navigates to login page via link", async ({ page }) => {
    await page.getByRole("link", { name: /prihlásiť sa/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("navigates back to booking page via link", async ({ page }) => {
    await page.getByRole("link", { name: /späť na rezerváciu/i }).click();
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  });
});

test.describe("login page registration link", () => {
  test("has link to registration page", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 30_000 });

    await page.getByRole("link", { name: /zaregistrujte sa/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole("heading", { name: /registrácia/i })).toBeVisible();
  });
});
