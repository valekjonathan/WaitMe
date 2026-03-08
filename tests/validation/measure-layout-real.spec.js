// @ts-check
/**
 * FASE 1 — Medición real de layout.
 * Ejecuta mediciones automáticas: zoomTopCreate, zoomTopNavigate, cardBottomCreate, cardBottomNavigate.
 * Calcula differenceZoom y differenceCard.
 * Validación: differenceZoom <= 1px, differenceCard <= 1px.
 */
import { test, expect } from '@playwright/test';

test.describe('Validación - Medición real de layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('medición CREATE: zoomTopCreate y cardBottomCreate', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    const visible = await createBtn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, 'Home no visible (login requerido)');
      return;
    }
    await createBtn.click();
    await expect(page.locator('[data-map-screen-panel]')).toBeVisible({ timeout: 10000 });
    await page
      .locator('[data-zoom-controls]')
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch((error) => {
        console.error('[WaitMe Error]', error);
      });
    await page.waitForTimeout(500);

    const m = await page.evaluate(() => {
      const zoom = document.querySelector('[data-zoom-controls]');
      const panelInner = document.querySelector('[data-map-screen-panel-inner]');
      const card = document.querySelector('[data-create-alert-card]');
      const zoomRect = zoom?.getBoundingClientRect();
      const innerRect = panelInner ?? card;
      const rect = innerRect?.getBoundingClientRect?.();
      return {
        zoomTopCreate: zoomRect?.top ?? null,
        cardBottomCreate: rect?.bottom ?? null,
      };
    });

    if (m.zoomTopCreate == null) {
      console.warn('[CREATE] data-zoom-controls no encontrado');
    }
    if (m.cardBottomCreate == null) {
      test.skip(true, 'Panel no visible en modo create (timing o viewport)');
      return;
    }
    console.log(
      '[CREATE] zoomTopCreate=',
      m.zoomTopCreate,
      'cardBottomCreate=',
      m.cardBottomCreate
    );
  });

  test('medición NAVIGATE: zoomTopNavigate y cardBottomNavigate', async ({ page }) => {
    const searchBtn = page.getByRole('button', { name: /dónde quieres aparcar/i });
    const visible = await searchBtn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, 'Home no visible (login requerido)');
      return;
    }
    await searchBtn.click();
    await expect(page.locator('[data-map-screen-panel]')).toBeVisible({ timeout: 10000 });
    await page
      .locator('[data-zoom-controls]')
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch((error) => {
        console.error('[WaitMe Error]', error);
      });
    await page.waitForTimeout(500);

    const m = await page.evaluate(() => {
      const zoom = document.querySelector('[data-zoom-controls]');
      const panelInner = document.querySelector('[data-map-screen-panel-inner]');
      const panel = document.querySelector('[data-map-screen-panel]');
      const zoomRect = zoom?.getBoundingClientRect();
      const rect = panelInner?.getBoundingClientRect?.() ?? panel?.getBoundingClientRect?.();
      return {
        zoomTopNavigate: zoomRect?.top ?? null,
        cardBottomNavigate: rect?.bottom ?? null,
      };
    });

    if (m.zoomTopNavigate == null) {
      console.warn('[NAVIGATE] data-zoom-controls no encontrado');
    }
    if (m.cardBottomNavigate == null) {
      test.skip(true, 'Panel no visible en modo search (timing o viewport)');
      return;
    }
    console.log(
      '[NAVIGATE] zoomTopNavigate=',
      m.zoomTopNavigate,
      'cardBottomNavigate=',
      m.cardBottomNavigate
    );
  });

  test('medición completa: CREATE → NAVIGATE, differenceZoom <= 1, differenceCard <= 1', async ({
    page,
  }) => {
    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    const searchBtn = page.getByRole('button', { name: /dónde quieres aparcar/i });
    const createVisible = await createBtn.isVisible().catch(() => false);
    if (!createVisible) {
      test.skip(true, 'Home no visible (login requerido)');
      return;
    }

    // CREATE
    await createBtn.click();
    await expect(page.locator('[data-map-screen-panel]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    const createM = await page.evaluate(() => {
      const zoom = document.querySelector('[data-zoom-controls]');
      const panelInner = document.querySelector('[data-map-screen-panel-inner]');
      const card = document.querySelector('[data-create-alert-card]');
      const zoomRect = zoom?.getBoundingClientRect();
      const rect = (panelInner ?? card)?.getBoundingClientRect?.();
      return {
        zoomTopCreate: zoomRect?.top ?? null,
        cardBottomCreate: rect?.bottom ?? null,
      };
    });

    // Volver a logo (evento waitme:goLogo) y entrar en NAVIGATE
    await page.evaluate(() => window.dispatchEvent(new Event('waitme:goLogo')));
    await page.waitForTimeout(500);

    const searchVisible = await searchBtn.isVisible().catch(() => false);
    if (!searchVisible) {
      test.skip(true, 'Botón search no visible tras volver');
      return;
    }
    await searchBtn.click();
    await expect(page.locator('[data-map-screen-panel]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);

    const navM = await page.evaluate(() => {
      const zoom = document.querySelector('[data-zoom-controls]');
      const panelInner = document.querySelector('[data-map-screen-panel-inner]');
      const zoomRect = zoom?.getBoundingClientRect();
      const rect = panelInner?.getBoundingClientRect?.();
      return {
        zoomTopNavigate: zoomRect?.top ?? null,
        cardBottomNavigate: rect?.bottom ?? null,
      };
    });

    const zoomTopCreate = createM.zoomTopCreate;
    const zoomTopNavigate = navM.zoomTopNavigate;
    const cardBottomCreate = createM.cardBottomCreate;
    const cardBottomNavigate = navM.cardBottomNavigate;

    const differenceZoom =
      zoomTopCreate != null && zoomTopNavigate != null
        ? Math.abs(zoomTopCreate - zoomTopNavigate)
        : null;
    const differenceCard =
      cardBottomCreate != null && cardBottomNavigate != null
        ? Math.abs(cardBottomCreate - cardBottomNavigate)
        : null;

    const result = {
      zoomTopCreate,
      zoomTopNavigate,
      cardBottomCreate,
      cardBottomNavigate,
      differenceZoom,
      differenceCard,
      okZoom: differenceZoom != null && differenceZoom <= 1,
      okCard: differenceCard != null && differenceCard <= 1,
    };

    console.log('\n=== MEDICIÓN LAYOUT REAL ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('===========================\n');

    expect(result.cardBottomCreate).not.toBeNull();
    expect(result.cardBottomNavigate).not.toBeNull();
    expect(
      result.differenceCard,
      `differenceCard=${result.differenceCard}px debe ser <= 1`
    ).toBeLessThanOrEqual(1);
    if (result.differenceZoom != null) {
      expect(
        result.differenceZoom,
        `differenceZoom=${result.differenceZoom}px debe ser <= 1`
      ).toBeLessThanOrEqual(1);
    }
  });
});
