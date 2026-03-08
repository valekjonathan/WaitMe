// @ts-check
import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT || 5174;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`;

/** Geolocation Oviedo (configurable con PLAYWRIGHT_GEOLOCATION) */
const geolocation = process.env.PLAYWRIGHT_GEOLOCATION
  ? JSON.parse(process.env.PLAYWRIGHT_GEOLOCATION)
  : { latitude: 43.3619, longitude: -5.8494 };

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/contracts/**', ...(process.env.CI ? ['**/validation/**'] : [])],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    geolocation,
    permissions: ['geolocation'],
    launchOptions: {
      args: ['--ignore-gpu-blocklist', '--use-gl=egl', '--enable-features=WebGL'],
    },
  },
  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
        },
      ]
    : [
        { name: 'webkit-mobile', use: { ...devices['iPhone 14'], browserName: 'webkit' } },
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      ],
  webServer: {
    command:
      process.env.VITE_SAFE_MODE === 'true'
        ? `VITE_SAFE_MODE=true npx vite --host --port ${port}`
        : `npx vite --host --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
