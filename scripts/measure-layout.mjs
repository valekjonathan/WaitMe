#!/usr/bin/env node
/**
 * Mide zoomTopCreate, zoomTopNavigate, cardBottomCreate, cardBottomNavigate, etc.
 * Ejecutar con servidor dev corriendo: node scripts/measure-layout.mjs
 */
import { chromium } from 'playwright';

const baseURL = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
  if (await createBtn.isVisible().catch(() => false)) {
    await createBtn.click();
    await page.waitForTimeout(1500);
  }

  const create = await page.evaluate(() => {
    const zoom = document.querySelector('[data-zoom-controls]');
    const card = document.querySelector('[data-create-alert-card]');
    const panel = document.querySelector('[data-map-screen-panel-inner]');
    const nav = document.querySelector('[data-waitme-nav]');
    const zoomBox = zoom?.getBoundingClientRect();
    const cardBox = (card ?? panel)?.getBoundingClientRect();
    const navBox = nav?.getBoundingClientRect();
    const m = window.__WAITME_CARD_MEASURE || {};
    const z = window.__WAITME_ZOOM_MEASURE || {};
    return {
      zoomTopCreate: zoomBox?.top ?? z.zoomTopCreate,
      cardBottomCreate: cardBox?.bottom ?? navBox?.top - 15 ?? m.createCardBottom,
      createCardBottom: m.createCardBottom,
      zoomMeasure: z,
    };
  });

  await page.goto(baseURL + '#/navigate', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const navigate = await page.evaluate(() => {
    const zoom = document.querySelector('[data-zoom-controls]');
    const panel = document.querySelector('[data-map-screen-panel-inner]');
    const nav = document.querySelector('[data-waitme-nav]');
    const zoomBox = zoom?.getBoundingClientRect();
    const panelBox = panel?.getBoundingClientRect();
    const navBox = nav?.getBoundingClientRect();
    const m = window.__WAITME_CARD_MEASURE || {};
    const z = window.__WAITME_ZOOM_MEASURE || {};
    return {
      zoomTopNavigate: zoomBox?.top ?? z.zoomTopNavigate,
      cardBottomNavigate: panelBox?.bottom ?? navBox?.top - 15 ?? m.navigateCardBottom,
      navigateCardBottom: m.navigateCardBottom,
    };
  });

  const diffZoom = create.zoomTopCreate != null && navigate.zoomTopNavigate != null
    ? Math.abs(create.zoomTopCreate - navigate.zoomTopNavigate)
    : null;
  const diffCard = create.cardBottomCreate != null && navigate.cardBottomNavigate != null
    ? Math.abs(create.cardBottomCreate - navigate.cardBottomNavigate)
    : null;

  console.log('\n=== MEDIDAS LAYOUT ===');
  console.log('zoomTopCreate:', create.zoomTopCreate?.toFixed(2));
  console.log('zoomTopNavigate:', navigate.zoomTopNavigate?.toFixed(2));
  console.log('differenceZoom:', diffZoom?.toFixed(2));
  console.log('cardBottomCreate:', create.cardBottomCreate?.toFixed(2));
  console.log('cardBottomNavigate:', navigate.cardBottomNavigate?.toFixed(2));
  console.log('differenceCard:', diffCard?.toFixed(2));

  await browser.close();
}

main().catch(console.error);
