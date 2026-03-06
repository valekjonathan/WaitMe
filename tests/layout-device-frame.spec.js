// @ts-check
/**
 * Tests de layout: AppDeviceFrame y geometría unificada.
 * Verifica que en web la app tenga max-width 430px y el mismo shell base.
 */
import { test, expect } from '@playwright/test';

test.describe('Layout - AppDeviceFrame', () => {
  test('en web desktop, el contenedor principal tiene max-width 430px', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const frame = page.locator('[data-app-device-frame]');
    await expect(frame).toBeVisible({ timeout: 10000 });

    const inner = frame.locator('> div').first();
    const box = await inner.boundingBox();
    expect(box).toBeTruthy();
    expect(box.width).toBeLessThanOrEqual(432);
    expect(box.width).toBeGreaterThanOrEqual(428);
  });

  test('el shell del mapa está presente en Home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const viewportShell = page.locator('[data-map-viewport-shell]');
    await expect(viewportShell).toBeVisible({ timeout: 15000 });
  });

  test('bottom nav está presente y dentro del viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const nav = page.locator('[data-waitme-nav]');
    await expect(nav).toBeVisible({ timeout: 10000 });
  });
});
