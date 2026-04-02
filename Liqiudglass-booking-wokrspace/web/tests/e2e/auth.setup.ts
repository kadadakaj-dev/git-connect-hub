import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const authFile = path.resolve(process.cwd(), "playwright/.auth/admin.json");

setup("authenticate", async ({ page }) => {
  const logFile = "debug_bypass.log";
  fs.appendFileSync(logFile, `Starting setup in ${process.cwd()}\n`);
  fs.appendFileSync(logFile, `Usage: NEXT_PUBLIC_E2E_BYPASS_AUTH=${process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH}\n`);

  if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === "1") {
    fs.appendFileSync(logFile, "Bypass enabled. Creating dummy auth file.\n");
    const authDir = path.dirname(authFile);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
      fs.appendFileSync(logFile, `Created dir: ${authDir}\n`);
    }
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
    fs.appendFileSync(logFile, `Wrote to: ${authFile}\n`);
    fs.appendFileSync(logFile, `Exists? ${fs.existsSync(authFile)}\n`);
    return;
  }

  if (!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASS) {
    console.warn("E2E_ADMIN_EMAIL or E2E_ADMIN_PASS not set, skipping auth setup");
    return;
  }

  try {
    await page.goto("/login");
    await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL);
    await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASS);
    await page.getByRole("button", { name: /sign in|login|prihlásiť/i }).click();

    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
    await page.waitForTimeout(2000); 

    await page.context().storageState({ path: authFile });
  } catch (error) {
    await page.screenshot({ path: "auth-failure.png", fullPage: true });
    console.error("Auth failed:", error);
    throw error;
  }
});
