import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';
import dns from 'node:dns';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Force IPv4 for localhost to avoid ETIMEDOUT on Windows
dns.setDefaultResultOrder('ipv4first');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:8082',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 8082',
    url: 'http://127.0.0.1:8082',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      // Provide fallback placeholder values so the Supabase client module can
      // initialise without throwing.  All actual network calls in E2E tests
      // are intercepted by Playwright route mocks, so these values are never
      // used for real requests.
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder_anon_key_for_e2e_tests',
      VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder_anon_key_for_e2e_tests',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});