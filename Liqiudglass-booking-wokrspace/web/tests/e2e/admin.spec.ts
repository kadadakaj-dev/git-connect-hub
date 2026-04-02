import { expect, test } from "@playwright/test";

test("admin dashboard renders core sections", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded", timeout: 30_000 });

  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByTestId("admin-dashboard")).toBeVisible({ timeout: 15_000 });

  // Wait for data to load from Supabase (loading spinner -> content)
  await expect(page.getByTestId("stat-revenue")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("stat-bookings")).toBeVisible();
  await expect(page.getByTestId("live-feed")).toBeVisible();
  await expect(page.getByTestId("revenue-chart")).toBeVisible();
});
