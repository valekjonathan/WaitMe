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
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
    ? [{ name: 'webkit-mobile', use: { ...devices['iPhone 14'], browserName: 'webkit' } }]
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
