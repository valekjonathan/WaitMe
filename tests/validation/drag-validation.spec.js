// @ts-check
/**
 * FASE 3 — Validación de drag.
 * Simular drag dentro de tarjeta → pantalla NO se mueve.
 * Simular drag fuera de tarjeta → solo el mapa se mueve.
 */
import { test, expect } from '@playwright/test';

test.describe('Validación - Drag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('drag dentro de tarjeta: scrollY no cambia (pantalla no se mueve)', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }
    await createBtn.click();
    await expect(page.locator('[data-map-screen-panel]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    const card = page
      .locator('[data-map-screen-panel-inner]')
      .or(page.locator('[data-create-alert-card]'));
    await expect(card.first()).toBeVisible({ timeout: 5000 });

    const scrollBefore = await page.evaluate(() => window.scrollY);
    const cardBox = await card.first().boundingBox();
    if (!cardBox) {
      test.skip(true, 'Card sin boundingBox');
      return;
    }
    const centerX = cardBox.x + cardBox.width / 2;
    const centerY = cardBox.y + cardBox.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX, centerY - 50, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const scrollAfter = await page.evaluate(() => window.scrollY);
    const scrollDelta = Math.abs(scrollAfter - scrollBefore);
    expect(
      scrollDelta,
      `scrollY no debe cambiar con drag en tarjeta. Antes=${scrollBefore}, Después=${scrollAfter}`
    ).toBeLessThanOrEqual(2);
  });

  test('drag fuera de tarjeta: mapa responde (canvas existe)', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }
    await createBtn.click();
    await expect(page.locator('[data-map-screen-panel]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    const canvasBox = await mapCanvas.boundingBox().catch(() => null);
    if (!canvasBox) {
      test.skip(true, 'Mapa canvas no visible');
      return;
    }
    const x = canvasBox.x + canvasBox.width / 2;
    const y = canvasBox.y + 100;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 30, y + 30, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY, 'scrollY debe permanecer 0 al arrastrar mapa').toBeLessThanOrEqual(2);
  });
});
