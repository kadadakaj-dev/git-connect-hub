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

// Provide safe placeholder values for Vite env vars so the dev server (webServer)
// can start in CI without real Supabase secrets.  These values are never sent to
// a real Supabase instance — all Supabase network calls in the E2E tests are
// intercepted by page.route() handlers.
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321'; // placeholder; matches local Supabase CLI default port

if (!process.env.VITE_SUPABASE_URL) {
    process.env.VITE_SUPABASE_URL = LOCAL_SUPABASE_URL;
}
if (!process.env.VITE_SUPABASE_ANON_KEY) {
    process.env.VITE_SUPABASE_ANON_KEY = 'e2e-placeholder-anon-key';
}
if (!process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'e2e-placeholder-publishable-key';
}

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
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});