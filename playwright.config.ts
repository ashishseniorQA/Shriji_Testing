import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

// Refuse to let a write/critical run silently target production. Smoke suites are
// read-only by convention and are exempt — see tests/smoke/README.md.
if (process.env.ENVIRONMENT === 'production' && process.env.ALLOW_WRITE_OPERATIONS !== 'false') {
  throw new Error(
    'ENVIRONMENT=production but ALLOW_WRITE_OPERATIONS is not explicitly "false". ' +
      'Refusing to start — see config/README.md environment policy.',
  );
}

// Base URL and credentials come from .env — see .env.example. Never hardcode here.
export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup.ts'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Live-confirmed 2026-07-08: this suite runs against a real, shared, rate-limited
  // testing environment (LV-33) — retries=0 locally was empirically unreliable (a
  // handful of failures per run from setup-step contention, not logic bugs; a retry
  // reliably clears them because it gets a fresh worker/context). Always retry once,
  // locally and in CI — this isn't masking flaky test logic, it's accounting for a
  // live external system's own concurrency/rate limits.
  retries: 1,
  // Every worker performs its own real login at startup (see utils/fixtures/auth.fixtures.ts)
  // — capping workers keeps that burst well under the rate limit. The fixture also
  // retries with backoff as a second line of defense; this cap reduces how often
  // that's needed.
  workers: 4,
  reporter: [
    ['list'],
    ['allure-playwright', { outputFolder: 'reports/allure-results' }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  outputDir: 'reports/videos',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
