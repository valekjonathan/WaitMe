// @ts-check
/**
 * Mide el gap REAL entre la tarjeta "Estoy aparcado aquí" y el menú inferior.
 * gap = navTop - cardBottom (en px)
 * Objetivo: gap = 20px ±1 (alineado con mapLayoutPadding y layout-map-create)
 */
import { test, expect } from '@playwright/test';

test.describe('Measure - Card to Nav gap', () => {
  test('medir gap real cardBottom vs navTop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    const isVisible = await createBtn.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Botón "Estoy aparcado aquí" no visible (¿Login en curso?)');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(2000);

    await page.setViewportSize({ width: 390, height: 844 });

    const card = page
      .locator('[class*="rounded-2xl"]')
      .filter({ hasText: /me voy en|minutos|euros/i })
      .first();
    const nav = page.locator('[data-waitme-nav]');

    await card.waitFor({ state: 'visible', timeout: 5000 });
    await nav.waitFor({ state: 'visible', timeout: 3000 });

    const cardBox = await card.boundingBox();
    const navBox = await nav.boundingBox();

    if (!cardBox || !navBox) {
      throw new Error('No se pudo obtener boundingBox de card o nav');
    }

    const cardBottom = cardBox.y + cardBox.height;
    const navTop = navBox.y;
    const gap = Math.round(navTop - cardBottom);

    // Output para captura
    const output = {
      cardBottom: Math.round(cardBottom),
      navTop: Math.round(navTop),
      gap,
      ok: gap >= 19 && gap <= 21,
    };

    console.log('\n=== GAP CARD-NAV (px) ===');
    console.log('cardBottom:', output.cardBottom);
    console.log('navTop:', output.navTop);
    console.log('gap (navTop - cardBottom):', output.gap);
    console.log('ok (19-21px):', output.ok);
    console.log('========================\n');

    // Assert: gap debe ser 20px ±1 (alineado con mapLayoutPadding)
    expect(
      gap,
      `gap=${gap}px (debe ser 19-21). cardBottom=${output.cardBottom}, navTop=${output.navTop}`
    ).toBeGreaterThanOrEqual(19);
    expect(gap, `gap=${gap}px (debe ser 19-21)`).toBeLessThanOrEqual(21);
  });
});
