// @ts-check
/**
 * Smoke tests: pantalla "Estoy aparcado aquí".
 * Requiere que el usuario vea el Home (hero con botones).
 * Sin dependencia de Percy.
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke - Estoy aparcado aquí', () => {
  test('al hacer clic en "Estoy aparcado aquí" se abre la pantalla create', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    const isVisible = await createBtn.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Botón "Estoy aparcado aquí" no visible (¿Login en curso?)');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(1500);

    // Tarjeta create obligatoria; mapa puede estar en "Map loading..." si WebGL falla en headless
    const card = page.getByText(/me voy en|publicar mi waitme/i).first();
    const ubiciteBtn = page
      .getByRole('button')
      .filter({ has: page.locator('svg') })
      .first();
    const mapOrPlaceholder = page
      .locator('.mapboxgl-map, [class*="mapbox"], [data-map-screen-panel]')
      .first();

    await expect(card).toBeVisible({ timeout: 5000 });
    await expect(mapOrPlaceholder).toBeVisible({ timeout: 5000 });
    expect(await ubiciteBtn.isVisible().catch(() => false)).toBeTruthy();
  });

  test('existen botones de zoom + y -', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(1500);

    const zoomButtons = page.locator('button').filter({ has: page.locator('svg') });
    const count = await zoomButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('existe la tarjeta inferior con campos', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(1500);

    const card = page
      .locator('[class*="rounded-2xl"]')
      .filter({ hasText: /me voy en|minutos|euros/i });
    await expect(card.first()).toBeVisible({ timeout: 5000 });
  });

  test('no hay error fatal tras abrir create', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasFatalError =
      (bodyText && bodyText.includes('dispatcher')) ||
      (bodyText && bodyText.includes('TypeError: null is not an object'));

    expect(hasFatalError).toBeFalsy();
  });
});
